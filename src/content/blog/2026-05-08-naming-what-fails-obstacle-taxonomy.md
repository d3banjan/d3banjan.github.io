---
title: 'Naming What Fails: The Obstacle Taxonomy'
description: '25+ preregistered kills over six weeks of compression research. The tempting story is "compression is hard." The physicist story is better: 25 kills, ~10 structural failure patterns, one Lean theorem per class.'
pubDate: 'May 08 2026'
tags: ["ml-research", "methodology", "lean4", "compression", "negative-results"]
series: "Notes on a Methodology Transition"
seriesOrder: 5
---

By week six, the experiment archive had over 25 preregistered, killed experiments. That's a lot of failures. Each one has a postmortem, a `decision.json`, trap results, and the SHA256-locked decision rule that made the kill clean. The machinery is documented in the [pre-registration post](/blog/2026-04-20-preregistration-ml/) and the [compression-falsification-ladder post](/blog/2026-04-28-compression-falsification-ladder/).

The tempting narrative at that point is "compression is hard." True, but uninformative. The physicist narrative is better: 25 kills, but they don't fail in 25 different ways. They fail in about 10 structural ways, repeatedly, with different surface-level appearances.

Naming those structures — the obstacle taxonomy — changed how the project runs.

---

## The taxonomy problem

In selectionist mode, each kill looks specific. A particular gate architecture on a particular layer range with a particular compression rank fails. You write the postmortem, note the mechanism, and move on. The mechanism isn't abstracted because there's no strong reason to abstract it early — you don't yet know if the same mechanism will reappear.

But mechanisms do reappear. After enough kills, you notice that the structural reason for failure is the same as something that died three experiments ago, just in different clothing. A compression gate that fails because its output covector is orthogonal to the token signal is failing for the same structural reason as a different gate that failed because the steering perturbation didn't reach the residual stream. Different surfaces, same geometry.

This is the taxonomy problem: when do you stop treating each kill as unique, and start treating them as instances of a named class?

The answer, empirically, is: later than you think. You need to see enough witnesses to a structural failure pattern before you trust the abstraction. If you name the class too early, you name it wrong — the class definition doesn't generalize cleanly to the next instance. After enough kills, the pattern is undeniable, and naming it becomes the natural move.

---

## The obstacle classes

The kills reduced to approximately 10 mechanism classes, labeled A through L. Two letters are skipped: Class E is a byte-versus-quality budget wall where the kill is pure arithmetic — the inequality is the whole result, no theorem adds anything — and Class I collects measurement-protocol bugs, kills of a measurement rather than of a mechanism. Neither is a structural obstacle, so neither gets a theorem. Here are the four classes that matter most for understanding the current state of the project:

**Class A: Source ⊥ output covector.**

The perturbation being applied is locally measurable — you can read it out at the compression point — but it doesn't propagate to the model output. Formally: define $\kappa := c(J^L u)$ where $J^L$ is the end-to-end Jacobian and $u$ is the compression perturbation direction. Class A failures have $\kappa \approx 0$ while the local readout is nonzero.

Nine separate experiments exhibited this pattern. Nine different surface appearances. One structural failure. The Lean theorem is `toy_readoutNull_iff_kappa_zero`: the readout is null if and only if $\kappa = 0$. Once that theorem exists, you can compute $\kappa$ for any candidate configuration before running it. If it's near zero, you don't run the experiment.

**Class K: Equal-readout collapses.**

Any steering scheme that uses a single covector readout fails this class trivially. The readout cannot distinguish configurations that produce orthogonal outputs — it's measuring a scalar projection of a high-dimensional difference, and the scalar is an insufficient statistic. Any architecture with a chart-style single readout is dead before it runs.

The Lean theorem is `equal_readouts_collapses`. This one was particularly productive as a filter: there's an entire family of steering designs that look superficially different but share the single-readout structure. The theorem eliminated all of them in one shot.

**Class L: Depth-composition inflation.**

The per-layer compression budget shrinks geometrically with depth. For an $L$-layer composed gate with end-to-end tolerance $\tau$:

$$\rho_l \leq (1+\tau)^{1/L} - 1$$

At $L = 30$ and $\tau = 0.05$, this gives $\rho_l \leq 0.0016$. A compression scheme that passes comfortably at layer 0, in isolation, may be catastrophically wrong after 30-layer composition. The G₄ kill documented in the [compression-falsification-ladder post](/blog/2026-04-28-compression-falsification-ladder/) is the empirical witness: +4.64% NLL inflation at 4-layer scope became +110.5% at 16-layer scope. Same compression scheme, different depth, 24× more damage.

The Lean theorem is `kills_iff_pow_exceeds`. Before the theorem, this pattern was only visible empirically — you ran at shallow scope, got a marginal result, ran at full scope, got a catastrophe. After the theorem, the budget computation is arithmetic. You don't need to run at full scope to know whether the configuration will survive it.

**Classes B, C, D (brief):**

- **Class B: Haar concentration.** The spectral concentration properties of SRHT-style rotations aren't a free parameter — they're determined by measure theory. Approaches that try to "learn" a better rotation than SRHT are chasing variance they can't access. The floor is $\sqrt{2/\pi}$ by construction.
- **Class C: Eckart-Young residual.** No rotation improves SVD truncation. The Eckart-Young theorem says the rank-$k$ SVD is the best rank-$k$ approximation in Frobenius norm, full stop. G₀ (rotate/permute weight axes before compressing) died here. The theorem is the kill.
- **Class D: Subset-family closure.** Certain structural properties are closed under the operations being applied — you can't escape the closure by composing more operations. This sounds abstract; in practice it rules out a class of "learned basis" approaches that implicitly assume the learned basis lives outside the closure.

---

## What the taxonomy buys

Before the taxonomy, each kill was isolated. The postmortem explained why *this specific configuration* failed. The connection to other failures wasn't visible.

After the taxonomy, the workflow changes:

1. A new candidate configuration arrives.
2. Before writing a prereg file, check it against the taxonomy. Does it have a single covector readout? Class K — don't run it, the theorem rules it out. Does it involve depth-composition at $L > 10$? Check the Class L budget arithmetic. Does it involve a rotation to improve SVD? Class C — cite Eckart-Young, close it.
3. If the configuration clears the taxonomy filter, *then* write the prereg and run the experiment.

The Lean theorem becomes the cheapest possible experiment: one line of type-checking instead of four GPU-hours. A configuration that's covered by an existing theorem doesn't need a new experiment. It needs a citation.

This is the physicist move described in [the previous post](/blog/2026-05-07-physicist-vs-selectionist-ml-research/): theorem-screened experiments. The experiments that remain after screening are better experiments — they probe behavior the theorems don't yet cover, which is exactly where empirical investigation is productive.

---

## The retrospective surprise

The taxonomy wasn't designed upfront. It emerged.

Classes K and L were both named in a single session, in week five. The empirical witnesses for both classes — the specific kills that exemplify them — had been sitting in the archive for weeks before the class definitions were written. The experiments landed before the abstraction. That's normal in selectionist mode: observe first, categorize later.

What surprised me was how much the retrospective categorization compressed the record. Twenty-five kills became approximately ten classes. Each class has one theorem. Ten theorems cover twenty-five kills. The compression ratio of the taxonomy is roughly 2.5:1 — each theorem does the work of about 2-3 separate empirical kills.

That ratio will keep improving. As the theorem library grows, each new theorem covers configurations that haven't been run yet, not just configurations that have already been killed. A theorem covering Class K configurations rules out all future Class K configurations, not just the historical witnesses. The future savings are larger than the historical savings.

---

## A falsifier theorem is stronger than a positive result

This is the part that took me longest to fully internalize.

`equal_readouts_collapses` doesn't say "this approach works with modifications." It doesn't say "this approach sometimes fails." It says: this structural property — having a single covector readout — implies failure, provably, for any instance of this class. No exceptions. No "try it with a different hyperparameter." Provably, for any configuration with this structure.

A Lean theorem with that character, covering nine previous empirical kills, is a stronger scientific result than a positive experiment on one model.

The positive experiment says: this specific thing worked, here, under these conditions. The falsifier theorem says: this structural class cannot work, anywhere, under any conditions. The scope is incomparably larger.

This is why the Lean proof discipline matters for a project like this. A Lean theorem is not a claim about one experiment. It's a claim about a class of experiments, proved by construction. Once it's proved, you stop running members of that class. Not because you've given up — because the question is closed.

The obstacle taxonomy is, in that sense, a record of closed questions. Not "we tried this and it didn't work out." Closed. Done. The next researcher working on neural network compression doesn't need to rediscover Class A or Class K. They can read the theorem and skip past years of potential misdirection.

That's what a negative result archive is supposed to do. Most negative results in ML aren't archived in a form that lets anyone else use them. A Lean falsifier theorem is the most reusable form a negative result can take: it's machine-checkable, it's precise about scope, and it's closed under logical consequence. If you can prove your candidate falls inside the class, you don't need to run it.

---

Twenty-five kills, ten classes, ten theorems. The next phase isn't more kills — it's proving theorems for the residual classes and running experiments only on configurations that clear the taxonomy filter. That's a different research program than the one that started six weeks ago, and it's a better one.

---

*Next: [Theorem-Screened Experiments](/blog/2026-05-09-theorem-screened-experiments/)*
