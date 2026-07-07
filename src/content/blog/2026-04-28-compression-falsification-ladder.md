---
title: 'How to Honestly Test if a Neural Network Can Be Compressed'
description: 'Pre-registration, trap cells, τ-hardened baselines, and kill-fast protocols: a field methodology for compression research that tries to kill its own ideas. With actual results from OLMoE-1B-7B.'
pubDate: 'Apr 28 2026'
tags: ["ml-research", "compression", "methodology", "quantization", "MoE"]
series: "Compressing MoE Without Lying To Yourself"
seriesOrder: 4
---

Neural network compression papers have a replication problem. Not the statistical kind—the kind where the ideas simply don't work outside the paper's experimental setup.

I've spent the last several months trying to compress OLMoE-1B-7B. Most of the ideas died. This post is the scoreboard: which ideas died, which one survived, and what the killing machinery looked like in action.

---

## The core problem

When you have spent months on a compression idea, you want it to work. Your brain will find ways to make the numbers look good: cherry-picking (test 5 models, report the best one), metric shopping (perplexity looked bad, switch to accuracy), hidden fine-tuning, no negative controls. The result is a literature where ideas look great in papers and fail in practice.

The fix isn't statistical rigor alone. It's **trying to kill your ideas** rather than prove them.

---

## The ladder

Think of compression as a series of increasingly ambitious claims. Each claim is a *rung*:

```
G₇: Replace the router with a cache of common expert combinations
G₆: Compress the routing matrix itself
G₅: Find sparse circuits that explain behavior
G₄: Use different compression for code vs. text vs. math
G₃: Compress the effective weight seen by each token
G₂: Reshape the weight tensor and hope structure appears
G₁: Apply a clever transform before compressing
G₀: Rotate or permute the weight axes
```

**Rule:** If a lower rung fails, everything above it fails too. You cannot claim task-conditional compression (G₄) if basic rotation (G₀) is already impossible.

Every rung runs under the pre-registration discipline from [the companion post](/blog/2026-04-20-preregistration-ml/): a SHA256-locked prereg file the experiment script refuses to run without, four trap cells that must fail if the method is real, and a τ baseline—the best score pure random chance achieves—that the method must beat by a clear margin. That post has the full mechanics; this one is about what the ladder actually produced.

Two field notes from living under those rules. First, the lock bit back: in early rounds the traps were too weak and results came back inconclusive, and the locked decision rule said "inconclusive = redesign and re-lock," not "inconclusive = call it a pass." Second, τ needed hardening—it drifted 0.03–0.09 between runs, enough to flip verdicts, until I went from 100 to 1000 samples and from 1 seed to 10, cutting the noise 10×. After that, a marginal result meant the idea was weak, not the measurement.

---

## What actually happened: the scoreboard

After running these rungs on OLMoE-1B-7B:

| Rung | What we tried | Verdict |
|------|--------------|---------|
| G₀ | Rotate/permute weight axes | **KILLED** — Eckart-Young: no rotation improves SVD truncation |
| G₂ | Reshape weight tensor across modes | **KILLED** |
| G₄ | Replace experts with static low-rank basis | **KILLED** — errors compound super-linearly across 16 layers |
| G₅ | Sparse linear feature circuits | **KILLED** — needs too many directions to be useful |
| G₆ | Compress the router directly | **KILLED** — router is already lean |
| G₁.0′ | Learned gauge → quantize → round-trip | **KILLED (r2)** — optimization adds nothing over free orthogonal rotation |
| G₁₀ | Residual-stream quantization | **DEEPEN-STRICT** — per-channel INT4 passes all 3 corpora at 16-layer scope |
| R₁ | RotorQuant on OLMoE experts | **IN FLIGHT** |

### The G₄ kill: why static basis compression is dead

G₄ was the strongest candidate: build a smaller "recipe book" of weight directions, shared across experts. We tried per-task bases (separate books for code, math, text) and a single universal 16-direction basis from code.

The task_swap trap was decisive on the first half of the claim: swapping a "code" basis onto "text" data destroyed performance in 12 out of 12 cells. The task-conditioning signal was real.

The compression claim built on it was not. Both variants died, and the universal basis failure is the instructive one. At 4 layers it looked almost okay. At 16 layers:

| Task | NLL inflation |
|------|--------------|
| Code (humaneval) | +9.9% |
| Math (gsm8k) | +60.9% |
| Text (wikitext) | +110.5% |

The 4-layer result was misleading: the 12 unpatched layers were acting as shock absorbers, hiding the damage. At full scope, the errors compound super-linearly. A 1% per-layer reconstruction error doesn't become 16% after 16 layers—it explodes, because each layer's mistake feeds into the next as input.

**The low-rank-effective-weight signal is real.** The *compression claim* based on it is not. Static projection does not survive end-to-end deployment.

### G₁.0′: the learned gauge story

This one had a surprising shape. We learned a bounded-condition-number transform M and measured whether it made quantization easier via the round-trip `W → M·W → quantize → M⁻¹·result → compare to W`.

Round r1: spectacular results—52–87% Frobenius round-trip error reduction across 24 triples (4 layers × 3 weight types × 2 bit-widths). Condition number settled at 1.42–2.17. Looked real.

Round r2: replaced the random-anisotropic trap with a pure orthogonal random transform (condition number exactly 1, sampled via QR of a Gaussian). The new gate: the optimized gauge must be 2× better than this orthogonal null.

Result: mean vs_orthogonal_ratio of 0.977 across all 24 triples. 100 Adam steps plus hard SVD projection achieves the same as a single QR decomposition at zero cost. The optimizer is a no-op.

The 52–87% improvement is real—it's just not from the optimization. It's from the rotation itself. Any orthogonal matrix redistributes per-tensor outlier mass, bringing max-abs closer to `||W||₂/sqrt(d)`. This is concentration-of-measure, already formalized in TurboQuant/RotorQuant/SRHT. G₁.0′ is closed as a *new lever*; it's a cross-architecture confirmation of Paper 1.

### G₁₀: what actually works

Residual-stream quantization: after the router picks 8 experts, quantize their output vectors before summing into the residual stream.

v1 (4-layer scope): INT8 passed, INT4 failed humaneval—same scope artifact as G₄.  
v2 (16-layer scope): INT8 clean, INT4 failed humaneval at +25.5%. Traps fired massively (INT2 +948%, random_scales +813%).  
v3 (per-channel INT4): swap per-expert scales for per-channel scales calibrated on 1000 wikitext tokens.

| Condition | Humaneval | GSM8K | Wikitext |
|-----------|-----------|-------|---------|
| Per-channel INT4 | +4.64% | +1.53% | +3.09% |
| INT2 trap | +174% | — | — |
| Random scales trap | +835% | — | — |

All three corpora pass at strict gates. Both traps fire. Eight megabytes of per-channel scale metadata buys a 4× activation-bandwidth saving. Deployable.

v4 tested whether top-K per-token outlier extraction would break the humaneval floor. It didn't—no monotonic trend across K ∈ {0, 8, 16, 32, 64}. The humaneval residual isn't "a few large numbers per token."

v5 ran a 3×3 calibration-vs-evaluation matrix. The diagonal entry (calibrate on humaneval, evaluate on humaneval) dropped inflation from +4.64% to +2.46%. The residual mechanism is calibration-distribution mismatch: humaneval weight activations are spikier than wikitext, and scales calibrated on wikitext hit saturation cliffs on humaneval's outlier channels.

---

## The kill-fast protocol

Before touching a GPU, check if the idea is mathematically possible:

| Check | Time |
|-------|------|
| Does the compressed form actually fit in fewer bytes? | 5 minutes, pencil and paper |
| What's the best possible error at this rank? (one SVD) | 5 minutes |
| Would random compression do just as well? | 5 minutes, numpy |

If any check fails, kill immediately. No GPU needed.

For actual experiments: run the hardest cell first. In my setup, Layer 3 + Wikitext was always hardest. If it fails, the entire rung is dead. 4 minutes instead of 60.

One addition I learned the hard way: **smoke discipline before long GPU runs**. Static checkers (`ruff`, `ty`) cannot catch device-state bugs. A type-correct PyTorch call like `tensor.detach().float().cpu()` will sail past every static analysis tool and explode at runtime if the tensor is a meta-tensor placeholder on CPU offload. Before any long run on an HF model loaded with `device_map="auto"`, the pre-flight must include a real `--dense_only` run that touches an offloaded layer. That five minutes caught a bug that would have surfaced 90 seconds into a 140-minute launch.

---

## Two ladders, not one

Once a project has a deployment target ("fit a 26 GB model on a 12 GB GPU"), pure mechanism work isn't enough. A deepen-strict result on a mechanism that doesn't move the byte budget is engineering value but not ship value.

The mechanism-rung ladder (G₀–G₁₀) asks: *is this mechanism real?* Gates on falsification traps.

The impact-rung ladder (R1–R7) asks: *does this mechanism shrink the byte budget enough?* Each rung opens with a specific GB delta on a budget-table line item. If you can't write that sentence, the rung isn't on the impact ladder.

R1 (RotorQuant on OLMoE experts) is the largest single impact lever: 40–44 GB off the expert footprint via SRHT-style rotation + INT2/INT1 quantization. Launched 2026-04-28; first run hit a meta-tensor read bug on CPU-offloaded layers. Fix in flight.

---

## What this process produces

When a rung is killed, the output is:

- `decision.json` — machine-readable verdict
- `postmortem.md` — why it died
- `trap_results.json` — evidence the traps worked
- Updated Lean theorem tracker — formal kills where they apply

Negative results become part of the record. Future researchers can see exactly why an idea died. They don't waste years rediscovering the same dead ends.

The goal is not to find a compression scheme. The goal is to find out—as fast and honestly as possible—which schemes are impossible.

---

*Full methodology: [compression-ladder-paper.pages.dev](https://compression-ladder-paper.pages.dev/). Engineering results from OLMoE experiments in the companion takeaways doc. Lean proofs linked from the paper microsites.*
