---
title: 'A Survey as a Living Document'
description: 'What it means to maintain a formal proof corpus that stays in sync with its own coverage badge, and what happened when RWKV was added as a new architectural family without invalidating existing theorems.'
pubDate: 'May 03 2026'
tags: ["ml-research", "lean4", "formal-verification", "RWKV", "methodology"]
series: "A Survey of Symmetries Compression Must Respect"
seriesOrder: 2
---

A survey paper is usually a snapshot. You write it at a point in time, submit it, and then it's frozen. Theorems that were missing when you submitted stay missing. Architectures that didn't exist when you wrote the background section don't appear in it. The paper is a fossil.

The [symmetry survey](/blog/2026-04-26-symmetry-survey-catalogue/) I've been building is not structured that way. It has a living proof corpus—Lean 4 theorems that accumulate as I prove them—and the document's coverage badge reflects the actual current state. When a theorem lands, the badge updates. When a new architecture gets added, the survey grows to accommodate it without invalidating anything already proved.

This post is about what it took to add RWKV to the survey without breaking the existing corpus—including one invariant with no Transformer analogue—and then the mechanics: how the pipeline works, what the coverage badge actually means, and why a handful of theorems are still open.

---

## Adding RWKV: A New Architectural Family

RWKV is a recurrent architecture—an alternative to Transformers that processes sequences with a recurrent state rather than full attention. It's interesting for compression research because the recurrent state has different structural invariants than attention: instead of Q/K/V projections and a dot-product attention mechanism, you have a time-mixing layer that updates a state vector, and a channel-mixing layer that conditions on the current token.

The symmetry catalogue already covered RoPE, SignPhase, BoundedArithmetic, DenseSparse, and Dormancy. All of these were originally motivated by Transformer architectures. When I added RWKV, the question was: which of these symmetry types still apply, which need refinement, and which RWKV-specific invariants are missing?

**What transferred directly.** SignPhase and BoundedArithmetic apply without modification. RWKV uses SiLU activations; sign violations under quantization work exactly as in Transformers. Integer accumulation arithmetic is architecture-agnostic.

**What needed refinement.** Dormancy. In Transformers, dormancy refers to attention heads or MLP neurons that have near-zero activation on average. In RWKV, the analogous concept is *state channels* that carry near-zero signal across time steps. The formal definition needed generalizing from "neurons" to "recurrent state channels," but the core theorem structure was the same.

**What was missing.** RWKV has a specific invariant with no Transformer analogue: **recurrent state stability**. The time-mixing update is (roughly) $s_t = \text{decay} \cdot s_{t-1} + k_t \cdot v_t$, where `decay` is a learned per-channel exponential decay factor bounded in $(0, 1)$. Compression that pushes `decay` outside $(0, 1)$—e.g., quantization that rounds a value of $0.98$ to $1.0$—turns a stable recurrent system into a marginally stable or unstable one. The state doesn't decay; it accumulates unboundedly.

This is RWKV's version of RoPE's orthogonality requirement: a numerical constraint with group-theoretic content. `decay` must stay in $(0, 1)$ not because the model was trained to like values in that range, but because that's the range over which the recurrent system is provably stable.

The RWKV section of the survey is a "receptacle" in the sense that it's a slot with a defined structure—informal statement, formal statement, proof, implications—waiting for each new theorem as it gets proved. Adding RWKV didn't invalidate any existing theorems because those theorems are about architectural features, not about specific architectures. RoPE's theorem doesn't say "this applies to GPT-2." It says "any Q/K projection that uses rotational position encoding must preserve the rotation group structure." RWKV doesn't use RoPE, so RWKV is simply out of scope for that theorem. No contradiction.

---

## The Autogen Snapshot Pipeline

The core of the live-update mechanism is a Python script that runs on every commit to the proof corpus. It does three things:

1. **Scan all `.olean` files.** Lean 4 compiles `.lean` source to `.olean` binaries. A compiled `.olean` exists if and only if the source compiled without error.

2. **Count sorry-free theorems.** Lean has an escape hatch: `sorry` is a keyword that tells the proof checker "trust me, this is true." A `sorry`-containing proof compiles, but it's not actually verified. The script greps the source (not the binary) for `sorry` and excludes any theorem that uses it from the count.

3. **Write `theorem-status.yaml`.** This file lists every target theorem, its proof status, and which source file it lives in. The microsite reads this file at build time and renders the coverage badge.

The pipeline result: the badge at [symmetry-survey-paper.pages.dev](https://symmetry-survey-paper.pages.dev/) always shows the real count. No manual updates, no "coming soon" placeholders that stay for months.

The `sorry` check is not optional. Without it, it would be trivially easy to inflate the coverage number—just add `sorry` to every unproved theorem and declare victory. The script refuses to count them. The invariant is: **if the badge shows N theorems proved, N theorems are actually proved**.

---

## The Remaining Open Theorems

The open theorems are not randomly distributed. They cluster around one specific intersection: **BoundedArithmetic under mixed-precision accumulation in a top-K sparse routing context**.

To be concrete: when an MoE model like OLMoE routes to top-K experts, and those experts are computed in INT4 or INT8, and the results are accumulated in INT32, the accumulation safety bounds depend on both the tile dimensions *and* the sparsity structure of the routing matrix. Proving a tight bound requires tracking both simultaneously.

The individual pieces are proved:
- BoundedArithmetic accumulation safety for dense matrices ✓
- DenseSparse top-K selection invariants ✓
- Their composition under float32 ✓

What's not proved: the composition under mixed-precision integer arithmetic. The difficulty is that integer overflow bounds are non-linear: you can't just add the individual error bounds. The accumulated error depends on the order of operations and the specific routing pattern.

These aren't theorems I've given up on. They're the theorems requiring the most careful Lean proof engineering—probably explicit bounds on intermediate accumulator values, which requires either manual case analysis or a decision procedure that Lean's tactics don't handle automatically.

They will land. They're just the hardest ones.

---

## What "Living" Actually Means

The standard model for a survey paper: write it, submit it, it becomes a fixed reference. Any updates require a new submission, a new version number, a new round of review.

The model I'm using: the proof corpus is the ground truth. The survey document is generated from it. When the corpus changes, the survey reflects that change automatically.

This creates a different kind of artifact. A reader visiting the microsite today sees the current state of the proof corpus—not the state when I submitted the first draft, not the state when I last remembered to update the table manually. The coverage badge is not aspirational. It's a CI build status.

The honest version of this: it also means the survey is always slightly incomplete. The open theorems are visible in the status table. The RWKV theorems still being developed are listed with their status. This is uncomfortable compared to a PDF that simply doesn't mention what wasn't proved. But it's more useful. A reader can see exactly what's been verified and what hasn't.

One concrete benefit: when I found the widget bug in the RoPE frequency visualization (described in the [previous post](/blog/2026-04-26-symmetry-survey-catalogue/))—the false $/16$ denominator causing the active-band display to wrap incorrectly—the correction went into the proof corpus, the survey regenerated, and the fix was visible immediately. A traditional PDF would have an erratum, or nothing at all.

---

## The Synchronization Problem

There's a harder version of this that I haven't fully solved: keeping the *informal* survey text synchronized with the proof corpus.

The theorem status is easy—it's machine-readable, the script handles it. But the explanatory prose around each theorem is written by hand. If the formal statement of a theorem changes (because the original formulation was too weak, or because I found a tighter bound), the prose might no longer accurately describe what's been proved.

Right now, I handle this by keeping the prose at a level of abstraction above the formal statement—describe the invariant, not the exact Lean type. This buys some tolerance for proof refactoring without prose rot. But it's not a complete solution.

The right solution is probably a structured format where each prose section has a machine-readable link to the theorem it's describing, and the CI pipeline flags when a theorem's signature changes without a corresponding prose update. I haven't built that yet.

What exists is good enough to be useful. The badge is accurate. The theorem list is accurate. The prose is written carefully enough that broad changes to the proof corpus would require obvious prose updates.

---

## Current State

The survey is live at [symmetry-survey-paper.pages.dev](https://symmetry-survey-paper.pages.dev/). The coverage badge reflects the real count. The theorem status table lists every target and its current proof state.

If you're working on compression research and you want to know whether a specific operation you're considering violates any of the catalogued invariants, the microsite is the answer. The open theorems are the ones where I can't yet make a formal guarantee—so if your compression scheme depends on the interaction of mixed-precision accumulation with MoE sparsity structure, the honest answer is: that's one of the open ones. Proceed with extra empirical scrutiny.

The RWKV section is the most recent addition. If you're compressing RWKV models and you're not checking decay stability under quantization, you now know that's a formally catalogued invariant, not just a practical concern.
