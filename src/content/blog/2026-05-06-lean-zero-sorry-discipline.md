---
title: 'Zero-Sorry Discipline: What a Lean 4 Appendix Actually Costs'
description: 'Two theorems in this paper — MoEGauge and JensenFloor — had to reach zero sorries before the paper shipped. What that process looks like, why sorry is dangerous, and what JensenFloor actually says.'
pubDate: 'May 06 2026'
series: "Compressing MoE Without Lying To Yourself"
seriesOrder: 3
tags: ["ml-research", "lean4", "formal-verification", "methodology"]
provenance: human-research-ai-written
---

Adding a Lean 4 appendix to an empirical ML paper sounds like it should make the paper stronger. It does — but not in the way most people expect. The value isn't that you have a proof assistant in your toolchain. The value is what happens when you try to close the sorry count to zero and the compiler tells you your proof doesn't work.

This post is about what that process looked like for two theorems: MoEGauge (the core bound on phase-collapse information loss) and JensenFloor (the quantization distortion floor). Both had to reach zero sorries before the paper shipped. Both required the underlying mathematical claims to be sharpened in ways that were not obvious from the prose version.

---

## What a sorry is

In Lean 4, `sorry` is an escape hatch. It tells the compiler: "I claim this step is true; don't verify it."

```lean4
theorem my_claim (x : ℝ) (hx : 0 < x) : x * x > 0 := by
  sorry  -- compiles fine; proof is not complete
```

Code with a `sorry` compiles without errors. The theorem appears in the namespace. You can use it in other proofs. The term `#check my_claim` returns a type signature that looks correct. The only difference from a proved theorem is that your `.olean` cache silently carries an axiom that says "assume this."

This is the danger. A proof with sorries compiles, passes CI, and looks done. It is not done. And if a downstream theorem depends on an unproved upstream result, the downstream theorem inherits the gap — but gives no signal that anything is missing.

Zero sorries is the only safe state. It's the condition where `#check axioms my_theorem` returns nothing but `Classical.choice`, `propext`, and the standard library — not `sorry`-derived axioms.

---

## Why this matters for the bound

The MoEGauge theorem bounds information loss from KV-cache quantization as a function of the moment-ratio gauge. Concretely: given a gauge value $G_\ell$ for layer $\ell$ and a $b$-bit quantizer, the theorem establishes a lower bound on the mutual information loss between the pre-quantization and post-quantization KV representations.

This bound is the foundation of the experimental design. It tells you which layers are in the phase-collapse regime where 1-bit quantization is *provably* impossible — not "probably bad," but "impossible given the moment statistics." The experimental design for OLMoE-1B-7B relied on this: we used the bound to identify collapse-regime layers before running a single GPU experiment, and then verified that the bound predictions matched empirical failure.

If the bound has a sorry in it — if even one step in the proof chain is admitted rather than proved — then "the bound predicts this layer will fail" is not a theorem, it's an assertion. The experimental design built on it is built on sand.

Getting MoEGauge to zero sorries took several significant proof rewrites. Each rewrite was triggered by the compiler rejecting something that seemed obvious in the prose.

---

## What MoEGauge's proof required

The first version of the proof had a gap in the monotonicity argument. The gauge construction aggregates per-head moment ratios using a `max(0, ·)` clamp:

$$G_\ell = \frac{1}{H} \sum_{h=1}^{H} \max(0, \mu_{h,\ell})$$

The original proof sketch treated the `max(0, ·)` as a detail and asserted that the aggregate was monotone in each $\mu_{h,\ell}$. Lean rejected this. The monotonicity of the aggregate under the clamp required a separate lemma, and that lemma required cases — positive and negative inputs to the clamp are not handled by the same argument. Writing that lemma forced precision about the domain of the moment ratio, which in turn forced a cleaner definition of what the gauge is measuring.

The second gap was in the connection between the moment-ratio statistics and the mutual information bound. The original argument used a result about sub-Gaussian distributions that was stated as folklore. When we tried to prove it in Lean, the sub-Gaussian assumption was not derivable from the moment-ratio conditions alone — it required an additional boundedness assumption on the activations.

This was not a small technical fix. Adding the boundedness assumption changed the statement of the theorem: the bound now holds for bounded-activation layers, with an explicit constant depending on the activation range. That constant appears in the final theorem statement and has to be computed from calibration data. The prose version had glossed over this.

The third gap was clerical but took two days: Lean's `mathlib` library had the required Jensen's inequality result, but in a form that required the function argument to be convex on an explicit closed interval, not just "convex." Matching the interface required constructing the interval explicitly from the activation bounds.

---

## JensenFloor: what it captures

JensenFloor is the second theorem in the appendix. It's a tight lower bound on the distortion introduced by floor quantization when the input has a given moment budget.

The informal claim: if you know the mean and variance of a distribution, and you apply a floor quantizer (round down to the nearest multiple of $\Delta$), the expected squared distortion is at least $f(\sigma^2, \Delta)$ for an explicit function $f$.

This is Jensen's inequality applied to the floor function. The floor function is convex on intervals between integers (where it's linear, hence both convex and concave), but globally it has a sawtooth shape that makes the application of Jensen non-trivial — you can't just invoke Jensen and call it done, because Jensen requires a convex function, and floor is not globally convex.

The theorem's content is handling this carefully. The result splits the expected distortion into within-bin contributions and between-bin contributions. The within-bin bound uses the fact that floor is locally linear (no distortion loss within a bin). The between-bin bound is where Jensen appears: conditional on being in a particular bin, the distribution has a bounded variance, and Jensen gives the distortion contribution from that variance.

The **floor distortion floor** (yes, two "floors") is then the sum over all bins, which gives a bound in terms of the global moments. The result is tight in the sense that it's achieved by a uniform distribution on $[k\Delta, (k+1)\Delta)$ for any $k$ — the worst-case distribution for a floor quantizer given a variance budget.

Why does this matter? The MoEGauge bound says which layers can't be quantized. JensenFloor says what the minimum damage is when you quantize anyway — it's the distortion floor below which you cannot go, no matter how clever your quantizer. Together, the two theorems bracket the problem: MoEGauge is the ceiling of achievability, JensenFloor is the floor of inevitable damage.

---

## Getting JensenFloor to zero sorries

JensenFloor was harder to close than MoEGauge. The argument involves a summation over quantization bins, and Lean required explicit finiteness arguments for the sum — you can't just write "sum over all bins" in Lean without establishing that the sum is finite and the index set is computable.

The fix was restricting the statement to activations with bounded support: the quantizer covers the range $[-M, M]$ for some $M$ derivable from the activation bound. This makes the bin index set finite explicitly, and the sum becomes a finite sum over an enumerable set.

The resulting theorem statement looks like:

```lean4
theorem JensenFloor
    (M Δ σ² : ℝ) (hM : 0 < M) (hΔ : 0 < Δ) (hσ : 0 < σ²)
    (hbound : σ² ≤ M ^ 2)
    (p : Distribution (-M) M) (hp : variance p = σ²) :
    distortion_floor p Δ ≥ floor_bound σ² Δ := by
  ...  -- zero sorries
```

The `floor_bound` function is explicit and computable — given $\sigma^2$ and $\Delta$, you can evaluate it numerically. This is what makes the bound useful in practice: the Lean theorem gives you a formula, and the formula runs.

---

## The living appendix model

The paper's Lean appendix is versioned alongside the paper. Each theorem has a status tag: `open`, `in-progress`, `zero-sorry`. The appendix ships only when all theorems are zero-sorry.

This sounds like it would slow down paper development. It does, slightly. What it prevents is more significant: it prevents the common failure mode where an empirical paper's "theoretical justification" section makes claims that are either false or require assumptions the paper doesn't state.

The prose of an ML paper can accommodate vagueness. "Under mild regularity conditions, the bound holds" is a sentence that can survive peer review even if the conditions aren't specified and the proof isn't complete. Lean cannot accommodate vagueness. Every condition has to be stated explicitly as a hypothesis. Every "mild" condition that seemed harmless in prose shows up as a type error in the proof.

This is a feature. The compression-falsification methodology described in the [companion post](/blog/2026-04-28-compression-falsification-ladder/) applies the same forcing function at the experimental level: pre-registration prevents you from quietly adjusting what "pass" means after seeing results. Zero-sorry discipline applies the same forcing function at the theoretical level: the proof either closes or it doesn't, and "it's clear that" is not a proof step.

The Lean status page for this paper lives on the [moe-gauge microsite](https://moe-gauge-paper.pages.dev/). Both theorems are zero-sorry at submission.

---

## The asymmetry between prose and proof

One observation worth naming directly: empirical ML papers hedge all the time. "We conjecture that..." "We believe the bound extends to..." "Future work will characterize..." These are normal and appropriate in a field where progress moves faster than proof.

The issue is when a proof-shaped claim is actually a hedge. "We prove that the gauge bounds information loss" sounds definitive. If the proof has a sorry, it's actually saying "we assert that the gauge bounds information loss and have written a proof template that would work if a few steps we haven't verified are true."

The discipline isn't about being more cautious in prose. It's about knowing which category your claim falls into. Empirical claims get empirical backing: experiments, trap cells, τ-baselines, pre-registration. Proof claims get proof backing: Lean, zero sorries, explicit hypothesis statements.

Mixing the categories — writing "we prove" for a sorry-laden argument — is the theoretical equivalent of the metric-shopping problem that makes compression papers unreliable. The fix is the same: decide in advance what counts as done, and actually require that condition before shipping.

---

*Lean source and appendix status page: [moe-gauge-paper.pages.dev](https://moe-gauge-paper.pages.dev/). Full compression methodology: [compression-falsification-ladder post](/blog/2026-04-28-compression-falsification-ladder/).*
