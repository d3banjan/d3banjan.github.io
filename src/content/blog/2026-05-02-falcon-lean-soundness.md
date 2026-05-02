---
title: 'Lean 4 as a Soundness Oracle for Security Properties'
description: 'Type stubs catch misuse at type-check time. But can we prove they are sound — that a well-typed program cannot trigger the dangerous code path? Enter Lean 4.'
pubDate: 'May 02 2026'
tags: ["security", "lean4", "formal-verification", "python", "type-theory"]
series: "Type-Stub Security Gates for ML Deserialization"
seriesOrder: 2
---

The [previous post](/blog/2026-05-01-falcon-pickle-security/) showed how `falcon-secure` uses Python type stubs to make unsafe pickle deserialization a static type error. A type checker sees a `TrustedBytes` annotation, sees raw `bytes` being passed, and flags the call before it runs.

This is useful. It is not the same as a proof.

A type checker can be wrong. It can have unsound inference rules, gaps in its handling of dynamic Python idioms, or simply not model the complete execution semantics. When the type checker says "this is fine," it means "I found no violation under my rules." That is evidence, not a guarantee.

This post is about the stronger claim: using Lean 4 to formally prove that a well-typed program *cannot* reach the dangerous code path. The distinction matters when the cost of being wrong is code execution on someone's production server.

---

## What Lean 4 is

Lean 4 is a proof assistant and functional programming language. A Lean *proof* is a program. The Lean compiler verifies that the program is a valid proof by construction — if it type-checks, the theorem is proved.

A rough analogy: Lean is to proofs what mypy is to types — except mypy can be wrong, and Lean cannot. When Lean accepts a proof, it is not making a probabilistic judgment. It is checking a formal derivation against the rules of Lean's dependent type theory (the Calculus of Inductive Constructions, with a small kernel that's been independently re-implemented and cross-checked). There is no "probably correct."

Unlike unit tests, which cover specific inputs, a Lean theorem is universally quantified. "For all inputs satisfying this property, no execution path reaches this code" is a single proof, not a thousand test cases.

Lean 4 is also a real programming language. You can write the model, the proof, and counter-examples that validate the model is non-vacuous — all in the same file.

---

## The taint model

The falcon-secure Lean work defines a **taint model**: a formal representation of which values are safe to deserialize and which are not.

The core types are `Tainted` and `Clean`. A value is `Tainted` if it came from an untrusted source — a file path, a network socket, a user-controlled string. A value is `Clean` only if it has passed through the `trust` gate, which in the model represents the point where provenance is verified.

In Lean 4, these are inductive types:

```lean
-- Approximate Lean 4 notation (readable, not exact syntax)

inductive Taint where
  | clean  : Taint   -- verified provenance
  | tainted : Taint  -- unknown origin

-- A value tagged with its taint status
structure Tagged (α : Type) where
  val : α
  taint : Taint

-- The trust gate: only way to produce a Clean-tagged value
def trust (data : Tagged Bytes) (provenance : String) : Tagged Bytes :=
  { val := data.val, taint := Taint.clean }

-- The dangerous function: requires Clean input
def deserialize (data : Tagged Bytes) : Option Object :=
  match data.taint with
  | Taint.clean   => some (unsafe_loads data.val)
  | Taint.tainted => none
```

This captures the policy: `deserialize` only proceeds on `Clean` data. A `Tainted` value produces `none` — the computation is blocked, not skipped silently.

The model is a simplification of the Python runtime, but that is the point. We are not verifying Python. We are verifying the *security invariant* — the claim that the trust gate is the only path from `Tainted` input to execution.

---

## The key theorems

Three theorems in the falcon-secure Lean formalization reached zero sorries (no placeholders, no holes — the proofs are complete).

### Theorem 1: `eval_not_tainted_without_loads`

A `Tainted` value cannot reach the `eval`-equivalent function unless it passes through a `loads`-equivalent function first.

```lean
-- Approximate statement
theorem eval_not_tainted_without_loads
    (input : Tagged Bytes)
    (h : input.taint = Taint.tainted) :
    eval_path input = none := by
  -- proof by case analysis on the execution path
  ...
```

The proof is by structural induction on the execution path. Every branch that leads to `eval` must pass through `deserialize`, and `deserialize` guards on `Taint.clean`. If `h` says the input is tainted, the guard blocks, and `eval` is unreachable. No execution trace can witness a `Tainted` value at `eval`.

### Theorem 2: `NoLoads` predicate

Any execution path that contains no `loads` call cannot produce a tainted value that escapes the computation boundary.

```lean
-- Approximate statement
def NoLoads (path : ExecutionPath) : Prop :=
  ∀ step ∈ path, ¬ IsLoadsCall step

theorem noloads_no_tainted_escape
    (path : ExecutionPath)
    (h : NoLoads path) :
    ∀ v ∈ outputs path, v.taint ≠ Taint.tainted := by
  ...
```

This is the contrapositive of the main claim: if no deserialization happened, nothing tainted got out. Combined with `eval_not_tainted_without_loads`, we have both directions: tainted input cannot escape *through* loads without passing the gate, and *without* loads, nothing tainted can appear at all.

### Theorem 3: `HasCast` simplification

The cast model — the formalization of the `trust` gate as an explicit type coercion — collapsed to a simpler form during proof, reducing the proof surface.

The original model had a two-step cast: `validate → coerce → mark_clean`. The proof revealed that `validate` and `coerce` were definitionally equal under the model's axioms — they computed the same thing, so the two steps collapsed to one. This is not a defect; it is the formal system telling you your model has redundancy. The simplified version has fewer cases to reason about, which makes the other proofs shorter and more auditable.

This kind of simplification is a standard outcome of formalization. You write what you think the model is, the proof search reveals what it actually is, and the gap between the two is where bugs hide.

---

## Leaks.lean: the counter-example corpus

Proving that safe programs cannot leak is only half the work. We also need to prove that *unsafe programs can* — otherwise the model is trivially satisfied by a theorem whose preconditions are never met.

`Leaks.lean` contains a corpus of programs that *do* leak, with proofs that they do:

```lean
-- A program that leaks: passes Tainted data directly to deserialize
-- bypassing the trust gate
def leaky_program (raw : Tagged Bytes) : Option Object :=
  deserialize raw  -- no trust() call

-- Proof that leaky_program produces none (the dangerous call is blocked)
-- but that this block represents a real policy violation
theorem leaky_program_is_blocked
    (raw : Tagged Bytes)
    (h : raw.taint = Taint.tainted) :
    leaky_program raw = none ∧ PolicyViolation leaky_program := by
  ...
```

The `PolicyViolation` predicate captures the important distinction: the program is blocked *at runtime* by the guard, but it *structurally violates the policy* by attempting to pass tainted data to `deserialize`. A type-correct version of this program would not compile — the static gate catches it first.

The counter-example corpus serves two purposes. First, it validates that the taint model is not vacuously true — there exist programs the model classifies as unsafe, and those programs really are unsafe. Second, it gives the model's "false negative" rate: are there *actually* unsafe programs the model classifies as safe? If `Leaks.lean` can prove a leak exists, and the main theorems claim no leaks exist in typed programs, then the two together bound what "well-typed" actually means.

This is the same logic as negative controls in experimental science. A test that cannot fail is not a test.

---

## What this buys you

Let me be concrete about what the combination of type stubs and Lean proofs actually provides, and what it does not.

**Type stubs alone** say: "The static type checker, under its inference rules, found no path from raw bytes to `loads`. If you add a call that bypasses this, the type checker will flag it."

**Lean proofs alone** say: "In the formal model, no well-typed program can produce a tainted value at the eval boundary. The model may not capture all of Python's semantics."

**Both together** say: "There is a formal model of the invariant. That model has been proved sound — no well-typed program violates it. The type stubs enforce the same invariant at the Python layer. The gap between the model and Python is documented, auditable, and smaller than the gap between 'I think this is safe' and 'I checked'."

What this does not give you: a proof about the Python interpreter itself, about C extensions, about `ctypes`, or about any code path that bypasses the Python type system. Formal verification operates on a model, and a model is always a simplification. The value of the Lean work is not absolute correctness; it is that the invariant has been stated precisely enough to be *provable at all*, which is a much stronger bar than "we believe this to be the case."

---

## Why this matters for ML security

ML model loading is not a solved problem. The ecosystem has converged on pickle as a de facto standard for model serialization. That standard is not going away — too much existing infrastructure depends on it. The practical question is not "how do we stop using pickle" but "how do we use pickle in a way that makes trust assumptions explicit and auditable."

Type stubs are the practical enforcement mechanism. Lean proofs are the soundness certificate. Neither is magic. But having both means that when someone asks "can a malicious model artifact execute arbitrary code in this application," the answer is not "we think we checked for that." The answer is: here is the invariant, here is the proof it holds in the model, here is the static gate that enforces it in code, here is the CI check that ensures new code cannot bypass it.

That is a different kind of answer.

---

*falcon-secure is at [github.com/d3banjan/falcon](https://github.com/d3banjan/falcon). The Lean formalization is in `proofs/`. CVE triage by package is on the project microsite. The first post in this series — on the type-stub mechanism itself — is at [/blog/2026-05-01-falcon-pickle-security/](/blog/2026-05-01-falcon-pickle-security/).*
