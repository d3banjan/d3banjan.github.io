---
title: 'Theorem-Screened Experiments'
description: 'A three-step decision rule for running fewer, better experiments: check your theorem library before you touch a GPU. Calibration checks, falsifier traps, and parameter compression from the physicist mode of ML research.'
pubDate: 'May 09 2026'
tags: ["ml-research", "methodology", "lean4", "experimental-design"]
series: "Notes on a Methodology Transition"
seriesOrder: 6
provenance: human-research-ai-written
---

The most expensive thing in empirical ML research is running an experiment that a proof could have killed.

A GPU-hour is cheap. Renting four of them costs less than a coffee subscription. A week of dead-end exploration costs something you can't buy back: the narrow window when your understanding of a problem is still sharp and your hypotheses are still crisp. The loss isn't the compute; it's the opportunity.

The selectionist approach I described in [earlier posts](/blog/2026-05-07-physicist-vs-selectionist-ml-research/) treats experiments as the primary unit of knowledge production. You design a probe, pre-register it, run it, interpret the result. Repeat. The physicist move is to treat *theorems* as the primary unit and use experiments only for what theorems can't settle.

The practical instrument for this is a three-step decision rule: run it before pre-registering any new probe.

---

## The theorem-first decision rule

**Step 1: Does a closed-form theorem apply?**

Before designing a probe, search the theorem library for any proved result whose hypotheses match the probe's configuration. If one exists, derive its prediction analytically. The probe then becomes a *calibration check* rather than exploration.

Concretely: if I want to test whether SRHT-style rotation improves per-tensor quantization error for a specific weight shape, I don't need to run a sweep. The concentration-of-measure bound gives a closed-form prediction: the expected Frobenius error after optimal rotation is bounded by a factor involving `sqrt(2/π)`. I run the experiment once, at one seed, to verify the constants match. Power requirement drops from "enough to detect a 15% effect at p < 0.05" to "enough to confirm a known quantity to two significant figures." That's one run instead of twelve.

The theorem doesn't eliminate the experiment. It transforms what the experiment is *for*. Calibration checks are fast, cheap, and interpretable. If the result matches the theorem's prediction, the machinery is working correctly. If it doesn't, something interesting is happening — which is itself a finding worth pursuing.

**Step 2: Is there a falsifier theorem for the observable?**

Even when a positive theorem doesn't apply, there may be a theorem that proves the proposed mechanism *cannot work* under certain conditions. A falsifier theorem costs almost nothing to add as a trap.

Example: if the probe tests whether task-conditional compression can survive 16 layers of composition, check whether any theorem addresses error propagation through residual connections under the proposed rank constraint. A super-linearity result — errors compound faster than linearly — is a falsifier. If such a theorem exists, build a mandatory trap cell that checks the 16-layer behavior directly, even if the main probe runs at 4-layer scope. The trap costs one extra evaluation pass. If it fires, the rung is dead before you've spent the full compute budget.

The discipline here is that the falsifier trap is *mandatory*, not optional. It goes into the pre-registration file, pre-locked, with an expected outcome of FAIL. If you're right and the mechanism works, the trap fires correctly and provides evidence. If the falsifier theorem was right, the trap fires and saves everything above this rung on the ladder.

**Step 3: If neither applies, name the theorem you hope to prove.**

When no theorem applies — positively or negatively — the probe is genuinely exploratory. Full empirical machinery is appropriate. But before locking the pre-registration, write one sentence: *what is the theorem I hope this probe produces evidence toward?*

This isn't decoration. It forces you to state, in advance, what general principle you expect the probe to support. "I expect this probe to provide evidence toward a theorem that per-channel scale calibration reduces activation quantization error to within X% of full-precision at 16-layer scope." That sentence shapes the probe design, the trap selection, and the postmortem. An exploratory probe without this sentence is fishing.

---

## What changes operationally

The old loop: observe a phenomenon → design a probe to characterize it → pre-register → run → interpret.

The new loop: observe a phenomenon → check theorem library (10 minutes) → run decision rule → pre-register if needed → run.

The time math is blunt. Checking a theorem library takes 10 minutes. Running a probe takes 1–4 GPU-hours plus setup time. If theorem coverage over your current research questions is 60%, you've eliminated 60% of GPU time. You've also eliminated the worst kind of GPU time: the kind spent re-confirming what a proof already establishes.

The 10 minutes isn't always sufficient. Sometimes checking a theorem means deriving its prediction for a new configuration — 30–60 minutes of Lean work. The correct comparison isn't "10 minutes vs. 4 GPU-hours." It's "2 hours of Lean work vs. N future probes that the Lean result makes unnecessary." One proved theorem about residual-stream error propagation replaces three separate G₄-style rung explorations. The cost accounting shifts from *cost per probe* to *cost per theorem*.

---

## Parameter compression

The selectionist probe carries 10–30 hyperparameters. A sweep over calibration corpus (3 options), trap cell design (varies per probe), gate recipe (varies per rung), seeds, data budget, layer scope — each is a free variable, each adds a retry axis when results are ambiguous.

The physicist probe carries 2–3. Here's where the excess comes from, and how to eliminate it:

| Parameter class | Selectionist | Physicist |
|---|---|---|
| Calibration corpus | Swept per probe (3 options) | One canonical corpus per deployment scenario, fixed |
| Trap cell design | Redesigned per probe | One canonical trap per obstacle class, fixed |
| Gate recipe | Customized per ladder rung | Same recipe across all rungs of a ladder, fixed |
| Remaining free variables | Seeds, layer scope, rank | Seeds, layer scope, rank |

Each fix removes an entire class of ambiguity. When results are marginal, the question was previously "is this the wrong corpus, or the wrong trap, or the wrong gate threshold?" With canonical choices fixed, the only question is whether the method itself is weak.

The trap cell fix is particularly high-leverage. When I was redesigning trap cells per probe, an inconclusive result could mean the trap was too weak or the method was too weak — indistinguishable without running the probe again with a stronger trap. With one canonical trap per obstacle class, an inconclusive result means exactly one thing: redesign the method.

---

## The cost model in concrete terms

One caveat before the numbers: these are ballpark figures, not timed measurements. The previous post could count 25 kills against 10 obstacle classes because every postmortem was on disk; nobody logs how long probe design takes. Read the ratios, not the digits.

Late selectionist mode:

- Probe design: 2–3 hours (includes trap design, gate selection, corpus choice)
- Pre-registration: 30 minutes
- Execution: 1–4 GPU-hours
- Postmortem: 1 hour

Physicist target:

- Theorem check: 10–30 minutes
- Pre-registration: 15 minutes (simpler, because canon choices are already fixed)
- Execution: ~30 minutes GPU
- Lean verification: 30 minutes
- Postmortem: 30 minutes

The Lean verification isn't overhead — it's the work. If the Lean check rules out the configuration before execution, the 30 minutes of Lean work just saved 4 GPU-hours. If it doesn't rule it out, the 30 minutes tightened the probe design and identified exactly what the experiment needs to demonstrate.

The strongest signal that this is working isn't the GPU savings — it's the theorem-to-probe ratio. Selectionist mode: roughly 1 Lean theorem per 3 probes, because theorems were downstream artifacts of experiments. Physicist target: 1 theorem per 1–2 probes, because theorems are upstream filters on which experiments run. Both ratios are impressions from eyeballing the repo, not counts like the kill tally in the previous post — I flag that plainly because this series keeps insisting on the difference.

---

## What theorem-screening doesn't do

It doesn't replace experiments. It filters which experiments to run.

The residual cases — genuine open questions where no theorem applies positively or negatively, and where the hoped-for theorem is speculative — still need full empirical treatment. The pre-registration discipline from the [first post](/blog/2026-04-20-preregistration-ml/), the trap cell design from the [compression ladder post](/blog/2026-04-28-compression-falsification-ladder/), the obstacle taxonomy from the [previous post](/blog/2026-05-08-naming-what-fails-obstacle-taxonomy/) — all of it stays for residual cases. The heavy selectionist machinery is exactly right for genuinely exploratory work.

Theorem-screening reduces the fraction of probes that are genuinely exploratory. What remains in that category is sharper and more honest about its exploratory nature, because the decision rule forces you to admit it explicitly — and to name what you're hoping to find.

The goal isn't to prove theorems instead of running experiments. It's to run experiments that theorems can't settle, and to run them with enough precision that the results contribute back to the theorem library.

---

*This is post 6 of the Notes on a Methodology Transition series. Previous posts: [Pre-Registration for Solo ML Researchers](/blog/2026-04-20-preregistration-ml/) · [What Experimental Design Actually Means](/blog/2026-05-05-experimental-design-ml-research/) · [Hypothesis Testing from Scratch, and Its Bayesian Analogue](/blog/2026-04-27-frequentist-bayesian-ml-experiments/) · [Two Research Modes, and Why the Second One Needs Lean 4](/blog/2026-05-07-physicist-vs-selectionist-ml-research/) · [Naming What Fails: The Obstacle Taxonomy](/blog/2026-05-08-naming-what-fails-obstacle-taxonomy/)*
