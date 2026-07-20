---
title: 'Stable Rank as an Overfitting Signature in LoRA Fine-Tuning'
description: 'Why we picked stable rank to detect overfitting geometry in DPO vs CLM fine-tuning, how it connects to "alignment geometry," and what the BitFit baseline was there to check.'
pubDate: 'Apr 18 2026'
tags: ["ml-research", "lora", "fine-tuning", "dpo", "geometry", "stable-rank"]
series: "Falsifying LoRA Alignment Geometry"
seriesOrder: 1
provenance: human-research-ai-written
---

The question we started with was small and embarrassing: after DPO fine-tuning, are the weight changes actually doing something geometrically different from standard language model training? Or are we just pattern-matching on a noisy signal?

Stable rank turned out to be the cheapest probe that could falsify the question. Below: why it's the right number, what "alignment geometry" means in plain terms, why DPO is worth separating from CLM, and where BitFit fits as a control.

---

## What "alignment geometry" means

When you fine-tune a language model, the weight matrices change. The question is: *how* do they change?

In a full fine-tune, every entry of every weight matrix can shift. LoRA constrains this: the update $\Delta W$ must have the form $BA$ where $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$, with $r \ll \min(d, k)$. So the update lives in a low-rank subspace.

"Alignment geometry" is just asking: which subspace? Is it correlated with the base model's weight structure? Does it point in a consistent direction across layers? Does DPO — which trains on preference pairs to make the model more "aligned" with human ratings — push in geometrically different directions than CLM pretraining or standard fine-tuning?

The claim we were investigating: **DPO fine-tuning leaves a geometrically distinct fingerprint in the weight update** compared to CLM fine-tuning. Specifically, that the DPO update $\Delta W_{\text{DPO}}$ sits in a different part of the base model's singular-value space than $\Delta W_{\text{CLM}}$.

That's the hypothesis. Now we needed a number to measure it.

---

## Stable rank: what it is, geometrically

The Frobenius norm of a matrix counts all singular values equally:

$$\|W\|_F^2 = \sum_i \sigma_i^2$$

The nuclear norm (also called the trace norm) sums the singular values themselves:

$$\|W\|_* = \sum_i \sigma_i$$

Stable rank is the ratio:

$$\text{srank}(W) = \frac{\|W\|_F^2}{\|W\|_2^2} = \frac{\sum_i \sigma_i^2}{\sigma_{\max}^2}$$

where $\|W\|_2 = \sigma_{\max}$ is the operator norm (the largest singular value).

Intuition: if you have a rank-$r$ matrix with all singular values equal, srank equals $r$. If the matrix is rank-$r$ but one singular value dominates all the others — all the "energy" is concentrated in one direction — srank approaches 1. A high srank means the matrix energy is spread across many directions; a low srank means it's concentrated in a few.

An equivalent way to write it:

$$\text{srank}(W) = \frac{\left(\sum_i \sigma_i^2\right)}{\max_i \sigma_i^2}$$

which is bounded below by 1 and above by $\text{rank}(W)$.

Why is this useful? Because overfitting in fine-tuning tends to concentrate gradient energy in a few dominant directions. A model that has memorized training artifacts will often have a $\Delta W$ whose srank is lower than it "should" be — the effective dimensionality of the update has collapsed.

This isn't a new observation. It's implicit in rank-selection heuristics for LoRA, where small-rank adapters tend to overfit faster than large-rank ones on short sequences. But it hadn't been used, as far as we could tell, as an explicit probe for DPO vs CLM differentiation.

---

## Why DPO is worth separating from CLM

Standard CLM fine-tuning optimizes the cross-entropy loss on next-token prediction. DPO (Direct Preference Optimization) does something structurally different: it optimizes a contrastive loss over pairs of outputs, one preferred and one rejected.

The DPO loss looks like:

$$\mathcal{L}_{\text{DPO}} = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} \right) \right]$$

The gradient pushes the model to increase the log-ratio for the preferred output and decrease it for the rejected one. The *direction* of the gradient in weight space depends jointly on the base model $\pi_{\text{ref}}$ and on both outputs in each pair.

<dl class="term-aside">
  <dt>CLM</dt>
  <dd>Causal Language Model — standard next-token prediction; cross-entropy loss over the training corpus one token at a time.</dd>
  <dt>DPO</dt>
  <dd>Direct Preference Optimization — contrastive loss over (preferred, rejected) response pairs; adjusts log-ratios relative to a frozen reference model, no reward model needed.</dd>
  <dt>LoRA</dt>
  <dd>Low-Rank Adaptation — constrains weight updates to ΔW = BA where rank(B), rank(A) ≪ d, so only a small fraction of parameters are trained.</dd>
</dl>

The practical effect is that DPO gradients are more volatile per sample than CLM gradients — each preference pair generates a direction that depends on a specific comparison rather than a marginal prediction. This is why DPO is known to be sensitive to data quality and why practitioners use short training runs with DPO to avoid degradation.

Our hypothesis was that this volatility would show up in srank: DPO updates would have lower stable rank than CLM updates on the same model, because the contrastive gradient produces spikier singular value distributions. And if we ran DPO to overfitting, we expected srank to collapse toward 1 as the model memorized specific preference-pair directions.

---

## The experimental setup

We ran on the Pythia family (EleutherAI/pythia-*) across three orders of width — 70M up to 1B. These aren't state-of-the-art models; they're clean, reproducible, and well-characterized. Using them means the results are checkable.

Three training conditions:

1. **CLM fine-tuning with LoRA** — standard next-token prediction, LoRA adapters on attention + MLP projection layers
2. **DPO fine-tuning with LoRA** — same adapter configuration, DPO loss
3. **BitFit** — bias-only fine-tuning (no LoRA adapters)

LoRA rank was held fixed at a generous setting (high enough that rank itself isn't the bottleneck) so that any srank collapse we saw was about the *update geometry*, not about us picking $r$ too small.

For each condition we measured srank of $\Delta W$ at each LoRA target layer across training, watching how it evolved from initialization (where it reflects the random adapter init) through convergence.

---

## BitFit: why it's there

BitFit updates only bias terms. Bias vectors are 1D — their "rank" isn't meaningful in the matrix sense. But measuring srank of the *effective weight change* it induces (via the output change at each layer) gives you a floor: what srank looks like when the update is intentionally constrained to a degenerate geometry.

More importantly, if DPO and CLM both show srank collapse at overfitting *and* BitFit does not, that's strong evidence the collapse is specific to the matrix-update geometry. If BitFit also shows collapse, the signal might be trivial — just a function of training duration or data repetition, not of update structure.

In other words: BitFit is a control. It's not competing with LoRA here. It's checking whether what we're measuring is real.

---

## What we set out to test

The hypothesis, stated falsifiably:

> **H1:** DPO LoRA fine-tuning produces lower stable rank in $\Delta W$ than CLM LoRA fine-tuning on the same model, all else equal, at comparable training-loss convergence.

> **H2:** Stable rank under DPO decreases monotonically with epoch count in the overfitting regime (i.e., after validation loss begins to increase).

Both are directional claims. H1 would be falsified by DPO srank being equal to or higher than CLM srank. H2 would be falsified by srank staying flat or increasing as the model overfits.

We also had a stronger sub-claim — the orthogonal-complement hypothesis — which gets its own post because it died its own death. You can read about that in [Adversarial Passes That Killed Claims](/blog/2026-04-22-lora-adversarial-passes/).

The methodology for locking decision rules before running experiments — pre-registration, $\tau$-hardened baselines, kill-fast protocols — is the same process described in [How to Honestly Test if a Neural Network Can Be Compressed](/blog/2026-04-28-compression-falsification-ladder/). Same discipline, different target.

Next: [the paper-as-codebase pattern](/blog/2026-04-19-lora-manuscript-as-code/), where the experimental pipeline and the manuscript share a Makefile.
