---
title: 'How to Honestly Test if a Neural Network Can Be Compressed'
description: 'Pre-registration, trap cells, τ-hardened baselines, and kill-fast protocols: a field methodology for compression research that tries to kill its own ideas. With actual results from OLMoE-1B-7B.'
pubDate: 'Apr 28 2026'
tags: ["ml-research", "compression", "methodology", "quantization", "MoE"]
---

Neural network compression papers have a replication problem. Not the statistical kind—the kind where the ideas simply don't work outside the paper's experimental setup.

I've spent the last several months trying to compress OLMoE-1B-7B. Most of the ideas died. This post is about the methodology I built to kill them cleanly—and what that process actually produced.

---

## The core problem

When you have spent months on a compression idea, you want it to work. Your brain will find ways to make the numbers look good.

The failure modes are well-documented:

- **Cherry-picking**: test 5 models, report the best one
- **Metric shopping**: perplexity looked bad, switch to accuracy
- **Hidden fine-tuning**: "post-training compression" but quietly fine-tuned for 3 epochs
- **No negative controls**: never check if a random method does just as well

The result is a literature where ideas look great in papers and fail in practice.

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

Every rung goes through the same lifecycle:

1. Write down exactly what you're testing and exactly how you'll decide pass/fail
2. Lock that document with a SHA256 hash—the experiment script refuses to run if the file changed
3. Run the cheapest possible test
4. Check four "trap cells" that should fail if your method is real
5. Compare against τ, the best score random chance could achieve
6. Apply the locked decision rule: pass → move up, fail → publish the failure and move on

---

## Pre-registration: locking the rules before you play

Before any experiment, I write a file called `tau.json`. It specifies:

- Exactly what's being tested
- Exactly how success is measured
- How many data points, which random seeds, what decision threshold

Then I compute a SHA256 hash of this file and embed it inside the file itself. The experiment script recomputes the hash at launch and refuses to start if anything changed.

This is the oldest trick in science, newly relevant for ML: **seal your exam answers before the test**.

In practice, this discipline caught real problems. In early rounds, the traps were too weak and I got "inconclusive" results. The locked rules said "inconclusive = redesign and re-lock," not "inconclusive = call it a pass." So I did. The second round had stronger traps and a clear kill.

---

## Trap cells: catching yourself cheating

Trap cells are automatic lie detectors embedded in every experiment. Four per rung:

**Trap 1: Random basis.** Replace the compression basis with a completely random one and run the same test. If your "clever" basis barely beats random, the cleverness is an illusion.

**Trap 2: Task swap.** Use the compression basis designed for code on text data (and vice versa). If code and text genuinely need different compression, swapping must hurt.

**Trap 3: Off-projection.** Deliberately route data through the part of the model that the compression basis explicitly ignores. If the basis captures the important directions, the ignored directions should be useless.

**Trap 4: Trivial pass.** Feed the uncompressed model through the evaluation pipeline. Expect zero error. If this fails, the error measurement is broken.

These aren't hypothetical safeguards. The task_swap trap was decisive on G₄: swapping a "code" basis onto "text" data destroyed performance in 12 out of 12 cells. That proved the task-conditioning signal was real. It also, eventually, helped prove the *compression claim* was not—but that came later.

---

## τ: the "how lucky is random?" test

τ is the best score you could get by pure chance.

Concretely: take the neural network weights, replace them with completely random directions of the same size, measure the error on real data, repeat 10 times, take the best result. That's τ.

A compression method only passes if it beats τ by a clear margin. If it barely beats random, nothing was discovered.

In early rounds, τ was unstable—it shifted 0.03–0.09 between runs, enough to flip results from "pass" to "fail." The fix was hardening: 10× more data (100 → 1000 samples) and averaging over 10 random seeds instead of 1. This reduced noise 10×. Now if a result is marginal, the problem is the compression idea, not statistical dust.

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

Both died, but the universal basis failure is instructive. At 4 layers it looked almost okay. At 16 layers:

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
