---
title: 'The Five-Minute Daily Drift Check'
description: 'Solo research programs drift one small exception at a time. Three shell commands, run daily, catch the most common protocol violations before they compound into reproducibility failures.'
pubDate: 'May 10 2026'
tags: ["ml-research", "methodology", "research-operations", "tooling"]
series: "Notes on a Methodology Transition"
seriesOrder: 7
---

Solo research programs drift. Not because the researcher is careless, but because each session adds small exceptions to the protocol that feel justified in the moment.

A tau file gets tweaked — the hypothesis still holds, just clarifying a threshold. A postmortem gets filed — but the obstacle-class footer gets deferred because the taxonomy was still evolving. A Lean proof gets restructured — but a downstream theorem now silently depends on a sorry placeholder that wasn't there yesterday. Individually invisible. Collectively fatal to reproducibility.

The fix isn't periodic audits. It's a daily check that catches drift at the single-session boundary, before it compounds.

Three checks. Under five minutes total. Run at the start or end of every research session.

---

## Check A — Obstacle-class footer compliance

Every postmortem document should end with a one-line classification: which obstacle class does this failure belong to?

The [obstacle taxonomy](/blog/2026-05-08-naming-what-fails-obstacle-taxonomy/) exists specifically so that individual failures accumulate into a typed kill catalogue rather than a flat list of dead ideas. Without the footer, the postmortem contributes to the list but not to the taxonomy. You can't query "how many G-class failures have involved error compounding across residual connections?" if half the postmortems are missing their classification.

The check:

```bash
grep -rL 'obstacle_class:' postmortems/
```

This lists every file in `postmortems/` that does *not* contain an `obstacle_class:` line. Each violation takes under a minute to fix once the taxonomy is known — you're adding one line to an existing file. If you don't know which class applies, that's a signal the taxonomy needs extending, which is itself useful information.

Running this daily means the maximum backlog is one session's worth of postmortems. Running it weekly means you're fixing five postmortems at once, which is annoying enough that the footer starts feeling like bureaucracy rather than the 30-second task it actually is.

---

## Check B — τ-hash drift

The pre-registration protocol, described in the [first post of this series](/blog/2026-04-20-preregistration-ml/), requires locking the hypothesis document before running any experiment. The experiment script refuses to launch if the document's hash doesn't match the stored value.

But the hash is only enforced at launch time. After the experiment runs, nothing prevents a postmortem from being filed against a slightly-modified tau file — a threshold that got "clarified," a corpus specification that got "updated." This is how pre-registration turns into post-diction without anyone consciously intending it.

The check is a one-liner per experiment directory:

```bash
# from inside an experiment directory
sha256sum tau.json
# compare to the hash stored in prereg.yaml or postmortem.md
```

Or, if you have a consistent file layout, a wrapper across all active experiments:

```bash
for dir in experiments/*/; do
  stored=$(grep 'sha256:' "$dir/prereg.yaml" | awk '{print $2}' | tr -d '"')
  actual=$(sha256sum "$dir/tau.json" | awk '{print $1}')
  [ "$stored" != "$actual" ] && echo "DRIFT: $dir"
done
```

Any mismatch is a protocol violation. The appropriate response is not to update the stored hash — it's to understand why the file changed. If the change was intentional (you re-locked with a protocol amendment), the stored hash should already reflect the new value. If you don't know why the file changed, that's the finding.

In four weeks of applying this check, I caught one mismatch. It turned out to be a legitimate re-lock that I'd forgotten to propagate to the postmortem reference. Harmless in isolation — but if I'd submitted the result without noticing, the stored hash in the postmortem would have been wrong. The paper trail would have been inconsistent in a way that's embarrassing to explain later.

---

## Check C — Theorem-status regression

After each session's Lean work, the proof count should be monotonically non-decreasing. A previously proved theorem that now shows a `sorry` means one of two things: either a proof-critical definition was modified without updating the downstream proof, or the Lean toolchain version changed and the proof no longer closes.

Either case needs immediate investigation, not deferred investigation. A sorry in a theorem you've claimed as proved is a retraction-level event for the internal record, even if nothing has been published.

The check depends on how you track theorem status, but the principle is constant: compare today's proof status against yesterday's. The tempting version is a grep-and-awk one-liner that counts `theorem` lines and `sorry` lines and subtracts. Don't use it — it silently miscounts whenever one theorem contains two sorries, or a sorry sits on a line that doesn't mention `theorem` at all. The build log is the ground truth, so check the build instead:

```bash
cd LeanProofs && lake build 2>&1 | grep -E 'warning|error|sorry'
```

Any sorry appearing in a file that was clean yesterday is a regression. The compiler catches this reliably — but only if you remember to run it. Adding it to the daily routine removes the "I'll check it next time" failure mode.

---

## Why daily and not weekly

The value of each individual check is low. The value of the *habit* is that drift never accumulates past one session.

Weekly checks mean a postmortem filed on Monday without a footer sits in violation for six days, during which time you write two more postmortems referencing the incomplete taxonomy. Weekly checks mean a tau drift discovered Friday covers a five-day window of ambiguity about which results were valid. Weekly checks mean a Lean regression from Tuesday has had four days to be built on top of.

Daily checks mean the maximum contamination radius is one session. Each check takes 30–90 seconds once the commands are in your shell history or a Makefile target. The total time cost is under five minutes.

This isn't heroic methodology. It's the research equivalent of `git status` before committing — a fast sanity check that catches the most common class of mistakes before they compound.

```makefile
# Add to your project Makefile
.PHONY: drift-check
drift-check:
	@echo "=== A: obstacle-class footers ==="
	@grep -rL 'obstacle_class:' postmortems/ || echo "All clear."
	@echo "=== B: tau-hash drift ==="
	@for dir in experiments/*/; do \
	  stored=$$(grep 'sha256:' "$$dir/prereg.yaml" | awk '{print $$2}' | tr -d '"'); \
	  actual=$$(sha256sum "$$dir/tau.json" | awk '{print $$1}'); \
	  [ "$$stored" != "$$actual" ] && echo "DRIFT: $$dir" || true; \
	done; echo "Hash check done."
	@echo "=== C: theorem status ==="
	@cd LeanProofs && lake build 2>&1 | grep -E 'sorry|error' || echo "Build clean."
```

`make drift-check`. Every session. The commands are boring because the point is that they should almost always return nothing. When they don't return nothing, you've caught something before it mattered.

---

*This is post 7 of the Notes on a Methodology Transition series. Previous posts: [Pre-Registration for Solo ML Researchers](/blog/2026-04-20-preregistration-ml/) · [What Experimental Design Actually Means](/blog/2026-05-05-experimental-design-ml-research/) · [Hypothesis Testing from Scratch, and Its Bayesian Analogue](/blog/2026-04-27-frequentist-bayesian-ml-experiments/) · [Two Research Modes, and Why the Second One Needs Lean 4](/blog/2026-05-07-physicist-vs-selectionist-ml-research/) · [Naming What Fails: The Obstacle Taxonomy](/blog/2026-05-08-naming-what-fails-obstacle-taxonomy/) · [Theorem-Screened Experiments](/blog/2026-05-09-theorem-screened-experiments/)*
