---
title: 'Two Research Modes, and Why the Second One Needs Lean 4'
description: 'AI makes hypothesis generation cheap. Evaluation stays expensive. Lean 4 proofs are the filter that changes the economics: a proved theorem screens an entire family of candidates before GPU time is allocated.'
pubDate: 'May 07 2026'
tags: ["ml-research", "methodology", "research-style", "lean4"]
series: "Notes on a Methodology Transition"
seriesOrder: 4
provenance: human-research-ai-written
---

There is a question that comes up at the start of every research session: *is this candidate worth running?*

For most of ML research history, the answer was roughly "yes, run it, we'll see." Compute was the bottleneck but candidate generation was also slow — you could only think of so many variants per day, and most of them came from intuition shaped by previous results.

That economics has changed. An LLM can generate 50 plausible compression variants in an afternoon. The bottleneck is no longer generating candidates; it is evaluating them. If you run everything, you are not moving faster — you are drowning in results you cannot interpret.

This is the problem that forced a methodological shift in my compression research, and the solution is not "run fewer experiments." It is "prove what you can before you run anything."

---

## The two modes

Call them selectionist and physicist, as shorthand.

**Selectionist**: generate many candidates, apply a selection pressure (falsification traps, pre-registered kill criteria), let the survivors name themselves. High throughput, retrospective categorization. The failure modes reveal themselves empirically. Good when you do not know what is going to fail, or why.

**Physicist**: derive a bound, use it to kill families of candidates on paper, run experiments only for what the bound cannot resolve. Low experiment count, high theoretical load. Good when you have proved enough of the failure mode structure to trust the predictions.

The critical word is *proved*. This is where Lean 4 enters.

---

## Why intuition is not enough

In selectionist mode, a "theoretical filter" looks like: "this configuration probably won't work because of depth-composition effects." You skip the run. Maybe you're right, maybe you miss a survivor. The filter is cheap because it's fast, and imprecise because it's intuitive.

In physicist mode, you want the filter to be *conclusive*. If a candidate fails the theorem, the verdict should be final — not "we think this won't work" but "this provably cannot work, and here is the machine-checked proof."

The difference matters for two reasons.

**Reuse.** An intuition is local — it applies to the specific configuration you were thinking about. A proved theorem covers an entire family. `kills_iff_pow_exceeds` says: if the per-layer compression ratio exceeds $(1+\tau)^{1/L} - 1$ for an $L$-layer composed gate with tolerance $\tau$, the configuration fails. That is a single theorem. It kills every configuration in that class, across all models, all layer counts, all hyperparameter settings in range. One proof, unlimited coverage.

**Trust.** A machine-checked Lean 4 proof with zero sorries is a different epistemic object than a sketch. It can be reviewed, versioned, and relied upon in CI. The theorem does not degrade — it does not "turn out to have a subtle error in the argument" the way a whiteboard proof sometimes does. If the proof compiles, the theorem holds.

---

## What this changes in practice

The practical shift is in where the question "is this candidate worth running?" gets answered.

Before the theorem library existed, that question was answered empirically: run it, wait for the kill or the pass. Each answer cost GPU time.

After the theorem library exists, the question has a two-stage answer:

```
1. Check theorems. Does any proved result cover this configuration?
   → If yes: verdict is immediate. No GPU time.
   → If no: the configuration is in unexplored territory.

2. Run experiment. The experiment now tests something the theorems cannot predict.
   → Result either validates the residual, or reveals a new failure mode.
   → New failure mode → prove it → add to library.
```

In this loop, the experiment count does not go to zero. But the *character* of the experiments changes. They test things the formal theory leaves open, not things that were always going to fail. That is a much better use of compute.

---

## How the theorem library gets built

You cannot start in physicist mode. The selectionist phase is not optional — it is how you learn what to prove.

At the start of a research program, the prior over failure modes is uniform. You do not know if compression will fail because of algebraic structure ([obstacle class K](/blog/2026-05-08-naming-what-fails-obstacle-taxonomy/), covector readout collapse — a single scalar readout cannot distinguish outputs that differ in directions it does not measure), depth-composition effects (class L, accumulated error blow-up — per-layer errors compound geometrically with depth until the end-to-end tolerance is blown), distributional mismatch, or something else. When the prior is uniform, breadth-first is the right strategy. Run the variants. Let the kills accumulate. Look at what the dead configurations have in common.

The kill pattern is the theorem waiting to be written. After 25+ kills over six weeks of compression research, the structural failure modes became visible: roughly 10 distinct patterns underlying all those surface-level variant failures. Once the pattern is clear, writing the Lean 4 proof is the next step — not because it is intellectually satisfying, but because a proved theorem with zero sorries is something a future experimental loop can actually use as a filter.

The selectionist phase was building the theorem library. That is what it was for.

---

## Where AI fits in

Once you have a theorem that kills a family of configurations, the problem of generating candidates changes shape. The difference is visible in the prompts.

Open-ended: "propose compression variants for OLMoE-1B-7B." The LLM generates 50 things, and a good share of them are dead on arrival — single-covector-readout steering schemes in new clothing, the exact family `equal_readouts_collapses` closed in one shot. An unconstrained prompt happily regenerates classes the library has already killed, and recognizing each retread is your time, spent re-filtering settled questions.

Constrained: "propose compression variants with no single-readout steering, per-layer ratio below the `kills_iff_pow_exceeds` bound $(1+\tau)^{1/L} - 1$ with $L=16$, $\tau=0.05$." The Class K retreads drop out, the depth-composition violations never appear, and what comes back sits in territory the theorem library does not cover — the only territory worth evaluating. You still verify every candidate; verification just starts past the dead classes instead of inside them.

The theorem is now a prompt constraint. That is what the combination buys: the LLM generates within a hypothesis space bounded by proved theorems, and experiments verify only what the theorems leave open.

Neither alone is enough. LLM-generated candidates without theorem filtering is noise. Theorem filtering without AI-assisted generation is slow. The combination is the productive regime.

---

## What the physicist mode produces

The clearest marker of physicist mode is not experiment count or theorem count. It is whether you have a *single number* that holds across all systems.

Six weeks of selectionist probing produced: `SRHT ≈ sqrt(2/π) ≈ 0.80`. The stable-rank floor after SRHT rotation. One number, all evaluable models, all dimensions $d$. Not "similar across architectures." One number.

Similarly: $\beta_{\text{cen,learned}} \approx 0.92$–$0.97$ across all evaluable models. Tight interval, architecture-independent. These are not summary statistics over a distribution. They are universal constants — the kind of number a physicist means when they say "the result."

Selectionist mode produces: coverage. You ran on 8 architectures and the phenomenon appeared in most of them. That is also useful, but it is a different kind of claim. Universality — the single number that does not depend on which system you are looking at — is the stronger claim, and it is what the theorem library enables. Once you can prove that the floor has to be $\sqrt{2/\pi}$, the empirical result is confirmation, not discovery.

---

## The transition is a prior update, not a conversion

I want to be precise about what changed. The preregistration discipline is intact. The kill criteria are intact. The falsification traps are intact. What changed is where the first filter sits in the pipeline.

In selectionist mode, the first filter is an experiment.
In physicist mode, the first filter is a theorem check.

Both modes falsify aggressively. The physicist mode falsifies cheaper, on more candidates, without running them. That is the only difference — but it is a large difference in research throughput when candidate generation is no longer the bottleneck.

The Lean 4 proofs are load-bearing infrastructure now, not academic output. They are the filter that makes AI-assisted candidate generation productive rather than overwhelming.

---

*The obstacle classes and their theorems are described in [Naming What Fails: An Obstacle Taxonomy](/blog/2026-05-08-naming-what-fails-obstacle-taxonomy/). The pre-registration and kill-criteria discipline that underpins both modes is in [Pre-registration for Solo ML Researchers](/blog/2026-04-20-preregistration-ml/).*
