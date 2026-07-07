---
title: 'A Catalogue of Symmetries Compression Must Respect'
description: 'Compression schemes regularly violate algebraic invariants of weight structure—producing models that pass perplexity checks but fail downstream. Here are the five core symmetry types a formally verified survey is collecting.'
pubDate: 'Apr 26 2026'
tags: ["ml-research", "compression", "symmetry", "quantization", "RoPE"]
series: "A Survey of Symmetries Compression Must Respect"
seriesOrder: 1
---

Compression research has a specific, underappreciated failure mode: schemes that are *algebraically illegal*.

Not wrong in the sense of bad hyperparameters. Wrong in the sense that they violate structural invariants baked into the model architecture—invariants that are invisible to perplexity metrics, invisible to benchmark evals on the right distribution, but catastrophic on anything the training distribution didn't anticipate.

The canonical version of this failure: quantize a model, watch perplexity improve slightly (the quantization noise acts as regularization), ship it, watch it silently degrade on a real task. The model wasn't compressed. It was *broken in a way that looked like improvement*.

The survey I've been building is a formal catalogue of these invariants. Each entry is a **symmetry type**: a structural property that compression must preserve or the model's behavior becomes undefined in a specific, provable way. Each entry maps to at least one theorem in Lean 4—a formal proof assistant—so "must preserve" is not handwaving but a machine-checked claim.

Here's what the catalogue currently contains.

---

## Why Lean 4?

Brief detour for readers unfamiliar with it: Lean 4 is a functional programming language and interactive theorem prover. You write mathematical statements and then *prove* them—the proof checker rejects anything that doesn't follow. It's not a testing framework. It's not fuzzing. It's formal verification: if the theorem compiles, the statement is true under the stated assumptions.

For a symmetry survey, this matters. "Compression that breaks rotational symmetry corrupts the relative-position signal" is a claim. Lean makes it a theorem. You can read the proof, check the assumptions, and know exactly what is and isn't covered.

Current coverage and the remaining gaps are summarized at the end.

---

## The Symmetry Catalogue

### 1. RoPE — Rotational Position Embedding

**What it is.** RoPE encodes token position by rotating the query and key vectors in pairs. If token at position $m$ has query $q$ and token at position $n$ has key $k$, the attention score becomes a function of the *difference* $m - n$, not the absolute positions. This is elegant: the model learns relative distances without any learned position embedding table.

The rotation acts on pairs of dimensions: $(q_{2i}, q_{2i+1})$ gets multiplied by a 2×2 rotation matrix $R(\theta_i \cdot m)$ where $\theta_i = 10000^{-2i/d}$. The full rotation is a block-diagonal orthogonal matrix in $\mathbb{R}^{d \times d}$.

**What compression breaks.** Quantization that treats Q and K projections as arbitrary weight matrices will clip outliers, round small values to zero, and generally destroy the rotation-group structure. The rotation matrix at position $m$ is no longer orthogonal after quantization—meaning it no longer preserves vector norms, no longer produces a clean dot product that depends only on $m - n$, and position encoding silently degrades.

The model still produces outputs. Perplexity on a fixed-position sequence may not visibly change. But tasks that require the model to track long-range dependencies—where the relative-position signal for large $|m - n|$ matters—will degrade.

**The widget bug that taught me something real.** During proof development, a visualization widget for the RoPE frequency spectrum had a bug: it was wrapping the active band at $\theta = 2\pi$ and using a false $/16$ denominator in the frequency calculation. The consequence was that the widget showed most of the rotation energy concentrated in a narrow band—which looked plausible, almost correct. But it was wrong, and the wrongness was *structural*: the same category of error as a quantization scheme that appears correct on a scalar analysis but breaks on the group-theoretic structure.

The Lean theorem for RoPE states, formally: an operation on the Q/K weight matrices is safe (in the sense of preserving relative-position encoding) only if it is a member of the orthogonal group on the rotation subspace. Quantization is not a member. Therefore quantization of Q/K requires explicit correction (e.g., RotorQuant-style SRHT pre-rotation that puts outliers in a basis where rounding is safer).

---

### 2. SignPhase — Sign and Phase of Weight Tensors

**What it is.** Weight tensors interact with activation functions. For common activations (ReLU, SiLU, GELU), the *sign* of the pre-activation input determines which regime the activation is in. The *phase* of complex-valued or frequency-domain representations encodes which direction a computation is happening in.

Neither sign nor phase survives naive quantization cleanly.

**What compression breaks.** Symmetric quantization clips both positive and negative outliers equally. Asymmetric quantization shifts the zero point. Either way, values that were just above zero (active under ReLU) can become zero (inactive), and values that were just below zero (inactive) can become nonzero (active). This isn't a continuous distortion—it's a *topology change*. The computation graph changes.

The downstream effect is systematic bias: neurons that should be reliably active become unreliably active, and the error is correlated across tokens (same weight matrix → same sign errors → same direction of systematic bias on every token in a batch).

The Lean theorems here cover the condition under which sign-preserving quantization is possible—roughly, when the minimum absolute value of active weights exceeds the quantization step size. When the condition isn't met, the theorem guarantees sign violations exist.

---

### 3. BoundedArithmetic — Integer Arithmetic Under Quantization

**What it is.** Float arithmetic has IEEE 754 semantics: overflow produces infinity or NaN, underflow produces subnormals or zero, and the mantissa gives you a predictable relative error. Integer arithmetic under quantization has different semantics: overflow wraps (or saturates, depending on hardware), underflow truncates, and the *absolute* error is bounded rather than *relative* error.

**What compression breaks.** Accumulators in matrix multiplications. When you multiply two INT8 matrices, the intermediate products are INT16 or INT32. If the accumulator type is wrong, or if the tile size means accumulator overflow is possible, the result is wrong in a non-local, non-monotone way. Not "slightly wrong"—wrap-around wrong.

This is not a theoretical concern. Mixed-precision kernels on real hardware have real accumulator constraints. The Lean theorems for BoundedArithmetic prove, under given tile dimensions and weight value ranges, that accumulation is safe. If the proof doesn't go through, the arithmetic is provably unsafe under those conditions.

This is the most "engineering" of the symmetry types—closest to hardware—but it's a symmetry in the algebraic sense: the integer arithmetic under wrapping has ring structure, and compression must not produce inputs that exit the valid ring.

---

### 4. DenseSparse — MoE Router Activation Patterns

**What it is.** Mixture-of-Experts (MoE) models—OLMoE, Mixtral, and their relatives—use a router that selects a small number of experts (typically 2–8 out of 64+) to process each token. The key property: the activated expert set is *sparse*. Most experts don't fire on most tokens. This isn't a bug to be corrected; it's the mechanism by which each expert specializes.

**What compression breaks.** Compression that acts on the router's output distribution—or that forces activations to be denser (e.g., by normalizing away the top-K selection, or by approximating the router's softmax output with a smoother distribution)—destroys expert specialization.

The router is not just selecting experts; it's enforcing a *partitioning* of the input distribution across experts. Compression that makes this partitioning softer (denser) means each expert now sees a wider input distribution—destroying the specialization that the model spent training building up.

The Lean theorems for DenseSparse cover the top-K selection invariant: if compression maps a top-K sparse selection to a distribution with effective support greater than K, it has violated the router's structural contract.

The concrete failure mode I encountered: in early G₄ experiments (see the [compression methodology post](/blog/2026-04-28-compression-falsification-ladder/)), compression of the effective weight matrix implicitly assumed the expert outputs were roughly interchangeable. They're not—the sparsity pattern is exactly the mechanism that makes them non-interchangeable.

---

### 5. Dormancy — Near-Zero Neurons

**What it is.** Trained neural networks contain dormant neurons: neurons with near-zero average activation across the training distribution. This is not the same as pruning candidates—dormant neurons may activate on rare, important inputs. They're dormant on average, not permanently inactive.

**What compression breaks.** Activation-based pruning kills dormant neurons directly (near-zero average activation → prune). Magnitude-based pruning catches a subset — those whose weights also happen to be small. But a dormant neuron that activates on a specific rare input type is performing a critical function. Removing it silently destroys that function.

The more subtle version: quantization with a small number of levels. A dormant neuron has weights and activations concentrated near zero. With coarse quantization, these get rounded to zero. The neuron is now actually dead, not just dormant.

The Lean theorem for dormancy establishes the condition under which a compression scheme is *dormancy-safe*: it must not decrease the maximum activation of any neuron below the threshold used to define dormancy. A proof that a compression scheme is dormancy-safe is a guarantee that rare-input behavior is preserved.

---

## The Structure of the Survey

Each of these five symmetry types has the same structure in the survey:

1. **Informal statement** — what the invariant is, in plain language
2. **Formal statement** — the Lean 4 type signature of the theorem
3. **Proof** — the Lean 4 proof term (machine-checked)
4. **Compression implications** — what specific compression operations violate the invariant and under what conditions
5. **Known repairs** — compression variants that provably preserve the invariant

The current count: **152 of 161 theorems** proved. The 9 remaining are the hardest geometric bounds—mainly around the interaction of BoundedArithmetic with the DenseSparse top-K structure in mixed-precision MoE kernels.

The live theorem status and full microsite are at [symmetry-survey-paper.pages.dev](https://symmetry-survey-paper.pages.dev/). The badge on that page updates automatically when a new theorem lands.

The next post in this series covers how that live update mechanism works, and what it meant to add RWKV as a new architectural family to the survey without invalidating the existing theorem corpus.
