---
title: 'Pre-Registration for Solo ML Researchers'
description: 'How to borrow the clinical trial discipline of writing down what "pass" looks like before running the experiment — and why a SHA256 hash is the cheapest honesty enforcement mechanism available.'
pubDate: 'Apr 20 2026'
tags: ["ml-research", "methodology", "pre-registration", "experimentation"]
series: "Notes on a Methodology Transition"
seriesOrder: 1
provenance: human-research-ai-written
---

The easiest person to deceive is yourself, and solo ML researchers are especially exposed: no co-authors to push back, no lab meeting where a skeptical postdoc asks why you switched metrics mid-run. Just you, your results, and a brain that wants the experiment to have worked.

Pre-registration is the clinical trial community's fix. Write down what you're testing and what "pass" looks like *before* you run the experiment, then seal the document so you can't quietly revise it afterward. This post is the minimal solo-researcher version of that discipline.

---

## Where this comes from: CONSORT and clinical pre-registration

Clinical trials have published a pre-registration standard called CONSORT (Consolidated Standards of Reporting Trials) since 1996. The core discipline is simple: register your trial with a public registry before enrolling patients. The registration document specifies the primary outcome, the statistical threshold for significance, the sample size, and the stopping rules. Once the trial starts, you can't change these without a public amendment.

This exists because unregistered trials had a severe publication bias problem. Positive results published. Negative results sat in filing cabinets. Drug companies ran 20 trials and published the 3 that worked. CONSORT made the plan public before the results existed — so a filing-cabinet kill becomes visible.

The same disease exists in ML. You run a method on 5 models and report the 2 that looked good. Your perplexity result is bad so you try accuracy, which is better, and that's what goes in the paper. This isn't fraud — it's motivated reasoning at sub-conscious speed, and it happens to virtually everyone who does this long enough.

Complex systems research and ecology have independently converged on the same fix. Ecologists pre-register field experiments before field season because data collection is expensive and irreversible. You decide what you're testing before you go, because you can't go back.

---

## The minimal ML version

You don't need a public registry. You need a file and a hash.

Here's a skeleton `prereg.yaml`:

```yaml
# prereg.yaml — lock this before touching a GPU
experiment_id: "g4-task-conditional-compression-v1"
hypothesis: >
  Per-task low-rank projection (rank 16) reduces reconstruction
  error on held-out expert weights vs a universal basis by at
  least 15% Frobenius norm, at 4-layer scope.

metrics:
  primary: frobenius_relative_error
  unit: "fraction of baseline"
  aggregation: mean over (4 layers × 3 weight_types × 2 bitwidths)

acceptance_criterion:
  pass_threshold: 0.85          # must be < 0.85× baseline
  comparison: "per-task vs universal"

kill_criterion:
  immediate_kill_if: >
    Any single (layer, weight_type) cell is worse than
    universal baseline, OR primary metric > 1.0.
  no_escalation: true           # kill does not get a second chance without re-lock

trap_cells:
  - name: random_basis
    description: Replace learned basis with a random orthonormal basis
    expected_outcome: FAIL (substantially worse than learned)
  - name: task_swap
    description: Use code-derived basis on math data and vice versa
    expected_outcome: FAIL (cross-task degradation must be visible)
  - name: off_projection
    description: Route data through the directions the method discards as unimportant
    expected_outcome: FAIL (if the discarded directions don't hurt, importance is misidentified)
  - name: trivial_pass
    description: Run uncompressed model through evaluation pipeline
    expected_outcome: PASS with near-zero error

tau_baseline:
  description: >
    Best Frobenius error achieved by random orthonormal projection
    of equal rank, sampled 10 times with different seeds.
  tau_must_beat: true           # acceptance requires beating tau by >10%

seeds: [42, 137, 271]
data_budget: 100_samples_per_corpus
corpora: ["humaneval", "gsm8k", "wikitext"]

locked_by: "sha256 embedded below"
sha256: ""                      # filled in by lock script; experiment refuses to run if mismatch
```

The lock script is ten lines:

```python
import hashlib, json, sys

def lock(path):
    text = open(path).read()
    # zero out the hash field, compute hash of the rest
    import re
    zeroed = re.sub(r'sha256: ".*"', 'sha256: ""', text)
    h = hashlib.sha256(zeroed.encode()).hexdigest()
    print(h)
```

Your experiment entry point does:

```python
import hashlib, re, sys

def check_prereg(path):
    text = open(path).read()
    stored = re.search(r'sha256: "([a-f0-9]+)"', text).group(1)
    zeroed = re.sub(r'sha256: ".*"', 'sha256: ""', text)
    computed = hashlib.sha256(zeroed.encode()).hexdigest()
    if computed != stored:
        print("PREREG TAMPERED. Refusing to run.")
        sys.exit(1)
```

If you edit the prereg file after locking — even to fix a typo — the hash breaks and nothing runs. This sounds annoying. That's the point. The friction is the discipline.

---

## Kill criteria vs acceptance criteria: they're not the same thing

Most researchers intuitively think about acceptance: "what does it look like if this works?" Kill criteria are different — they're the conditions under which you stop *immediately*, before completing the experiment.

The distinction matters because long experiments tempt you to "wait and see." Kill criteria prevent that.

**Acceptance criterion:** The primary metric clears a pre-specified threshold AND the traps behave as expected AND the result beats τ. All three required.

**Kill criterion:** An immediate abort condition. Examples:
- Any single cell is *worse* than baseline — if the method can hurt, it doesn't have controlled benefits
- The trivial-pass trap fails — the measurement pipeline is broken; no results are trustworthy
- τ is within margin of your result — you haven't found anything over random chance

Kill criteria are first-class citizens of the prereg file. They don't get negotiated after you see the numbers. In the compression work described in the [companion methodology post](/blog/2026-04-28-compression-falsification-ladder/), the kill was applied at full scope (16-layer) when results that looked marginal at 4-layer scope exploded super-linearly. The kill criterion had been pre-specified: "any cell worse than baseline at full scope." It fired. The idea died cleanly.

---

## Trap cells: negative controls that must fail

A trap cell is an experimental condition where you know the right answer in advance, and that answer is *failure*.

The trap cell logic: if your method is detecting something real, then deliberately breaking the signal should produce obviously worse results. If it doesn't — if your "clever" method matches a broken version — then the method isn't doing what you think.

Four traps that cover most ML compression work:

**Random basis.** Replace whatever learned representation you built with a random orthonormal matrix of the same shape. If your learned basis barely beats this, the learning added nothing.

**Task swap.** If you claim task-conditional behavior (code experts different from math experts), swap the conditioning. Use code-derived compression on math data. Expected outcome: degradation. If swapping is fine, there's no real task signal.

**Off-projection.** Route data deliberately through the directions your method claims are unimportant. If those directions are truly unimportant, this should hurt badly. If it doesn't hurt, your method isn't identifying importance correctly.

**Trivial pass.** Run the uncompressed baseline through your evaluation pipeline. If the uncompressed baseline doesn't score perfectly (within numerical noise), the metric is broken. This catches bugs early.

Trap cells are committed to the prereg file before locking. If the traps don't fire as expected, the experiment result is uninterpretable — you write "inconclusive" and redesign, not "ambiguous but promising."

---

## τ: what random chance achieves

τ is the score you'd get by pure chance.

The procedure: take your method's structural form (e.g., rank-16 projection), instantiate it with completely random parameters (Gaussian, then QR-decomposed to orthonormal), run the evaluation, repeat 10 times, take the best score across seeds. That's τ.

Your method has to beat τ by a clear margin — not barely, not "within error bars." A method that matches random projection is not a method; it's random projection.

τ also needs to be stable. If τ shifts 0.05 between seeds, your measurement noise is too high to distinguish a real result from a lucky seed. The fix is more data (I had to go from 100 to 1000 calibration samples) and averaging over more seeds. Once τ is stable, results that are marginal are marginal for the right reason: the idea is weak, not the measurement.

---

## What this produces

After locking and running, you have:
- A prereg file with the decision rules
- A result JSON with the actual numbers
- The automated decision (pass / fail / kill) applied mechanically from the prereg rules
- A postmortem if the result is a kill

The postmortem is not optional. A killed idea with a written postmortem is a contribution to the record — future researchers can see why it died and not repeat it. A killed idea with no postmortem is just a lost GPU budget.

The [compression-falsification-ladder post](/blog/2026-04-28-compression-falsification-ladder/) documents what this produces at scale: a machine-readable scoreboard where each rung has a clear verdict, the trap results that support it, and the updated decision archive. That post is the fuller worked example — this one is the minimal standalone version of the discipline.

---

## The overhead is lower than you think

The first prereg takes 30 minutes to write. Subsequent ones, once you have a template, take 10. The hash script is 10 lines. The entry-point check is 5 lines.

What you get back: results you can trust. Kills that are clean. A record that doesn't require you to remember what you intended to test three months ago. And, importantly, a forcing function that makes you think carefully about what "success" actually means before you invest GPU time in chasing it.

The solo researcher's problem is not that they're dishonest. It's that they're alone with their hypotheses, which is the most dangerous possible environment for motivated reasoning. Pre-registration is accountability infrastructure for a research team of one.
