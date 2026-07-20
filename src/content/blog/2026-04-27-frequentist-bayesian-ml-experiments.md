---
title: 'Hypothesis Testing from Scratch, and Its Bayesian Analogue'
description: 'Frequentist hypothesis testing rebuilt from first principles for ML researchers who half-remember p-values. Then: the Bayesian reframe, why it fits the kill-ladder better, and what each one actually buys you.'
pubDate: 'Apr 27 2026'
tags: ["ml-research", "methodology", "statistics", "bayesian", "hypothesis-testing"]
series: "Notes on a Methodology Transition"
seriesOrder: 3
provenance: human-research-ai-written
---

Most ML researchers have a vague, uncomfortable relationship with p-values. You learned the formula, you know 0.05 is the magic number, and you have a nagging feeling that you are not quite using it right.

That feeling is correct. This post rebuilds frequentist hypothesis testing from first principles — not to rehabilitate it, but to understand exactly what it does and does not certify. Then we build the Bayesian analogue from scratch and contrast the two. Both matter for the kill-ladder methodology; they are doing different jobs.

---

## What hypothesis testing is trying to do

You ran an experiment. You observed a result. The question is: was that result caused by the thing you think it was caused by, or could it have appeared by chance even if the thing you care about had no effect at all?

That is the only question frequentist hypothesis testing answers. Not "how big is the effect?" Not "will this replicate?" Not "is my model of the mechanism correct?" Just: *is this result too large to be explained by chance alone?*

To answer this, you need to know what "chance alone" looks like. That requires specifying a **null hypothesis** — a precise model of the world where your effect does not exist — and deriving what results that world would produce.

---

## A concrete example: does DPO fine-tuning change stable rank?

Stable rank (srank) measures how spread out a weight matrix's singular values are. High srank means energy distributed across many directions; low srank means concentrated in a few. The hypothesis: DPO fine-tuning collapses srank relative to standard CLM fine-tuning.

**Step 1: State the null hypothesis.**

$H_0$: DPO fine-tuning does not change srank. The distribution of srank values under DPO is the same as under CLM.

This is a precise claim. It does not say the effect is small — it says the effect is zero. That matters.

**Step 2: Choose a test statistic.**

The test statistic is the number you compute from your data to measure the effect. Here: mean srank difference across all weight matrices in the model.

$$T = \overline{\text{srank}}_{\text{DPO}} - \overline{\text{srank}}_{\text{CLM}}$$

**Step 3: Derive the null distribution.**

Under $H_0$, DPO and CLM produce the same srank values — the labels "DPO" and "CLM" are meaningless. So if you randomly shuffle which values get the label "DPO" and which get "CLM," the test statistic should look the same as the one you observed. Do this many times and you get the **null distribution**: the distribution of $T$ that chance alone produces.

This is a permutation test. No distributional assumptions needed.

```python
import numpy as np

def permutation_test(srank_clm, srank_dpo, n_permutations=10_000):
    observed = srank_dpo.mean() - srank_clm.mean()
    combined = np.concatenate([srank_clm, srank_dpo])
    n = len(srank_clm)

    null = []
    for _ in range(n_permutations):
        perm = np.random.permutation(combined)
        null.append(perm[n:].mean() - perm[:n].mean())

    null = np.array(null)
    p_value = (np.abs(null) >= np.abs(observed)).mean()
    return observed, p_value

# observed=-0.12, p_value=0.003
```

**Step 4: Compute the p-value.**

The p-value is the fraction of null-distribution draws that are at least as extreme as what you observed. `p=0.003` means: if $H_0$ were true, you would see a difference this large only 0.3% of the time.

**Step 5: Decide.**

If p < threshold (typically 0.05), you reject $H_0$. You conclude the result is unlikely under the null.

---

## What the p-value does NOT tell you

This is where most ML papers go wrong. The p-value certifies exactly one thing: the result is unlikely under $H_0$. That is all.

It does **not** certify:
- The effect is large. A p-value of 0.001 on a mean srank drop of 0.001 is statistically significant and practically meaningless.
- The effect will replicate. The p-value is about this dataset, this model, this random seed.
- Your mechanism is correct. Srank dropped — maybe because of DPO's gradient structure, or maybe because the DPO training data had a quirky length distribution that your experimental setup confused with a weight-geometry effect. The p-value cannot distinguish these.

The 95% confidence interval addresses the first issue: `[-0.13, -0.11]` tells you the effect is substantial, not just nonzero. Always report intervals alongside p-values.

---

## Where the frequentist scaffold breaks

The frequentist tools above work correctly under one assumption: the analysis plan was fixed before seeing the data. This assumption is systematically violated in ML research.

**Multiple comparisons.** You run five random seeds and report the best one. Implicitly you ran five tests and selected the most significant. Your effective p-value is not 0.05 — it is approximately $1 - (1-0.05)^5 \approx 0.23$. You are reporting a one-in-four chance result as if it were one-in-twenty.

**Optional stopping.** You check loss every epoch and stop when it looks good. The p-value formula assumes a fixed sample size decided before seeing data. Stopping based on observed results inflates type-I error — the probability of declaring an effect when there is none.

**Metric shopping.** Perplexity looked bad, so you switched to BLEU and reported that. The p-value for BLEU is conditional on having not reported perplexity — conditioning the reported test omits part of the search.

None of this is dishonest in intent. It is how exploratory research works. The problem is that p-values computed under these conditions do not mean what the notation says they mean.

The pre-registration discipline described in [the previous post](/blog/2026-05-05-experimental-design-ml-research/) is the direct fix: lock the hypothesis, the metric, the stopping rule, and the decision threshold before running anything. The analysis plan is then genuinely fixed, and the p-value means what it says.

---

## The Bayesian reframe

Bayesian statistics starts from a different question. Not "is this result unlikely under the null?" but "given what I observed, what should I believe about the effect size?"

The two key objects:

**Prior**: $p(\delta)$ — your belief about the true effect size $\delta$ *before* seeing data. This is explicit and subjective. Before running the DPO srank experiment, I believe DPO probably reduces srank (the gradient structure makes this plausible) but I am uncertain about the magnitude. I encode this as $p(\delta) = \mathcal{N}(-0.1, 0.04)$ — mean drop of 0.1, standard deviation 0.2.

**Likelihood**: $p(\text{data} \mid \delta)$ — how probable is the observed data if the true effect is $\delta$? With 28 layers, each with its own srank measurement, the sample mean has distribution $\mathcal{N}(\delta, \sigma^2/28)$.

**Posterior**: $p(\delta \mid \text{data})$ — your updated belief after seeing the data. By Bayes' theorem:

$$p(\delta \mid \text{data}) \propto p(\text{data} \mid \delta) \cdot p(\delta)$$

For Gaussian prior and Gaussian likelihood, the posterior is also Gaussian, and the update is a precision-weighted average:

```python
def bayesian_update(prior_mean, prior_std, obs_mean, obs_std, n):
    prior_prec = 1 / prior_std**2
    like_prec  = n / obs_std**2
    post_prec  = prior_prec + like_prec
    post_mean  = (prior_prec * prior_mean + like_prec * obs_mean) / post_prec
    post_std   = post_prec**-0.5
    return post_mean, post_std

# prior N(-0.1, 0.2), obs mean=-0.12, obs std=0.08, n=28 layers
post_mean, post_std = bayesian_update(-0.1, 0.2, -0.12, 0.08, 28)
# → post_mean ≈ -0.119, post_std ≈ 0.015
```

The posterior says: after seeing the data, my best estimate of the true srank drop is −0.119, with uncertainty ±0.015. I can directly compute the probability that the drop exceeds any threshold I care about: `P(δ < -0.05) ≈ 99.9%`.

That is a direct answer to "is the effect practically meaningful?" — something the p-value cannot give.

---

## The Bayesian decision criterion: expected information gain

The Bayesian frame also gives a natural criterion for "is this experiment worth running?" before you commit the GPU hours.

Expected information gain (EIG) is the expected reduction in uncertainty about $\delta$ if you run the experiment:

$$\text{EIG} = \mathbb{E}_y \bigl[ H(p(\delta)) - H(p(\delta \mid y)) \bigr]$$

where $H$ is entropy and the expectation is over possible outcomes $y$ weighted by how probable each is under your current beliefs. High EIG: the experiment will substantially sharpen your posterior regardless of outcome. Low EIG: you already know enough that the experiment cannot move your beliefs much.

This is the natural language for the pre-flight check in the kill-ladder: before allocating a 140-minute GPU run, ask whether the best possible outcome would update your beliefs enough to justify the cost. If the EIG calculation says no — if even a strong positive result would leave you nearly as uncertain — the experiment is low value and gets killed before it starts.

---

## The differences, stated plainly

| | Frequentist | Bayesian |
|---|---|---|
| **What it outputs** | p-value: probability of data under null | Posterior: updated belief distribution over effect |
| **What you need upfront** | A null hypothesis and test statistic | A prior over the effect size |
| **Effect size** | Not directly — need CI separately | Directly: posterior mean and credible interval |
| **Optional stopping** | Invalidates the p-value | Valid — posterior is posterior whenever you stop |
| **Small sample** | Unreliable, needs asymptotic validity | Works, but posterior is more prior-sensitive |
| **Common vocabulary** | Universal — reviewers expect it | Less common in ML, requires justification |
| **Pre-registration need** | Essential — the math assumes it | Less critical, but still good practice |

Neither wins unconditionally. The frequentist tools are the common vocabulary of peer review — you cannot avoid them entirely. The Bayesian frame is the right mental model for making decisions under uncertainty, for sequential experimentation, and for communicating how much your evidence moves the needle.

---

## How the kill-ladder uses both

The kill-ladder is a sequential decision procedure. Its structure is Bayesian at the spine — each experiment updates beliefs, and the decision to kill or continue is based on the posterior state — but it speaks frequentist at the skin, because decision rules need to be stated in terms reviewers can check.

A kill criterion looks like: "if the metric improvement is less than τ = 0.02 over the baseline at all three seeds, the hypothesis is killed." That is a frequentist decision rule — fixed threshold, pre-specified. But the τ itself was chosen by asking "what posterior update would I need before I believe this mechanism is real?" — a Bayesian question.

The trap cells are the same hybrid. Pre-specified triggers (frequentist discipline) that check for confounds the Bayesian prior does not encode (the prior knows nothing about length bias in DPO training data; the trap cell catches it).

The combination is the right tool for a solo researcher without a statistics team: frequentist scaffolding that makes the procedure legible and reviewable, Bayesian spine that makes the decisions correct.

---

*Next in the series: [Two Research Modes, and Why the Second One Needs Lean 4](/blog/2026-05-07-physicist-vs-selectionist-ml-research/)*
