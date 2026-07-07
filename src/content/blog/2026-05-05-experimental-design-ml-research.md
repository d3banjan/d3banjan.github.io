---
title: 'What Experimental Design Actually Means'
description: 'Theoretical physicists barely need it. Experimental physicists cannot live without it. Life sciences rewrote it for complexity. Pharma made it law. ML borrows the wrong one.'
pubDate: 'May 05 2026'
tags: ["ml-research", "methodology", "experimental-design", "statistics"]
series: "Notes on a Methodology Transition"
seriesOrder: 2
---

My training is reductive. Physics background, IISER Kolkata — the instinct is to take the simplest model that contains the phenomenon, write down two parameters, derive a prediction, measure one number. If the number does not appear, the model is wrong. This is a clean way to think, and it does not require elaborate experimental design because the theory tells you what to measure.

I spent time around biology labs at IISER and did not understand, at the time, why their experimental design felt so different — more elaborate, more hedged, more preoccupied with controls and confounders. It read like uncertainty dressed up as rigor. It took me until I started doing compression research to understand what they were actually doing: managing a system too complex to derive your way through.

This post is about that gap — between the physicist's relationship to experimental design and the life scientist's — and why it matters for how I am running this research program now.

---

When a theoretical physicist writes a paper, the experimental design is almost beside the point. The theory makes a prediction — one specific number, one specific functional form. You go measure it. The measurement either agrees or it does not. What matters is whether the prediction was right, not whether the measurement setup was clever.

This works because the theory is tight enough to specify what to measure. You do not need to worry about confounders when you are measuring the deflection of light around the sun: there is one effect, it has a predicted magnitude, and the experiment either finds it or it does not. Experimental design in the sense of "how do I make sure I am measuring what I think I am measuring" is a solved problem — the theory tells you.

---

## Experimental physics: design is the work

Experimental physicists have a harder job. They are often looking for an effect that theory has predicted but not pinned down — or looking for effects theory has not yet described. The measurement itself is where the difficulty lives.

Consider measuring the magnetic moment of the muon. The Standard Model predicts a value. Experimentally, you want to measure whether the actual value deviates from the prediction — a deviation would signal new physics. The challenge is not building a magnet. It is building an experiment where every other source of deviation — thermal noise, detector calibration, systematic biases in the measurement apparatus — is controlled tightly enough that a small genuine deviation can be seen.

This is experimental design: the systematic elimination of alternative explanations for your result. Every design choice is an answer to the question "what else could produce this signal?" You run control experiments, you vary conditions deliberately, you measure the same thing with two independent methods, you look for the signal's predicted dependence on external parameters.

The structure is: *you control what you can, and you account for what you cannot.*

---

## Life sciences: complexity breaks the controls

Biology and medicine inherit the physicist's instinct for experimental control but immediately run into a wall: the systems are too complex to control.

A drug trial cannot hold "everything else constant." The subjects are humans with genetic variation, comorbidities, different diets, different stress levels, different baseline disease progression. You cannot randomize their biology. You cannot repeat the experiment on the same subject in a different condition — the first condition already changed them.

This forced a different statistical machinery. The randomized controlled trial (RCT) is the answer to the complexity problem: if you cannot control what is different between subjects, randomize the assignment to treatment and control. Randomization does not eliminate the confounders — it distributes them randomly between groups, so that on average they cancel out. The placebo arm is not there because the placebo has no effect; it is there because the act of receiving treatment has effects (the placebo effect), and you need to isolate the drug's contribution from the treatment-receiving effect.

The double-blind design — where neither the subject nor the measurer knows who received treatment — addresses a different class of confounders: expectation and observer bias. The subject's outcome changes if they know they received the real drug. The measurer's assessment changes if they know they are looking at a treated subject. Blinding prevents both.

Pre-registration appeared in clinical trials because the stakes became high enough that the community could not afford p-hacking. A pharmaceutical company running fifty trials will, by chance, find three with p < 0.05 even if the drug does nothing. Pre-registration — publishing the hypothesis, the primary endpoint, and the analysis plan before seeing any data — closes this loophole. The trial is evaluated against the plan that was locked before it ran, not against the best interpretation of the results after they arrived.

---

## What ML research actually looks like

ML experiments look much more like biology than physics. The subject — a neural network — is a complex system with many interacting components. You cannot hold "everything else constant" when you change a training hyperparameter, because changing the learning rate changes the implicit regularization, which changes which solution the optimizer finds, which changes the learned representations, which changes downstream task performance. The confounders are everywhere and they are structural.

Despite this, ML papers often present results as if they were theoretical physics: one experiment, one number, one claim. The implicit assumption is that the single experiment is clean enough to bear the weight of the claim. This assumption is almost always false.

The ML literature replication crisis is the result. An effect reported on one dataset, one model size, one random seed, measured by the authors who designed the method — is not the same thing as an effect that will survive an independent replication on a different dataset, different model size, different random seed, measured by a group with no stake in the outcome. The first kind of result is common in ML papers. The second kind is rarer.

---

## The structure we borrowed

I have written about the machinery itself elsewhere — [the pre-registration workflow](/blog/2026-04-20-preregistration-ml/) and [the full falsification ladder](/blog/2026-04-28-compression-falsification-ladder/) — so here I will only draw the map back to the clinical trial. Pre-registration is the locked analysis plan: the decision rule committed before the search begins, because the search itself produces false positives no matter how honest you are. The τ-baseline is the control arm: it measures what a trivial intervention — random reinitialization, a bias-only fine-tune — achieves, so the method's effect can be separated from the natural variance of training. The trap cells are the pre-specified secondary endpoints: the confounds to check — length bias, checkpoint timing, distribution shift — named before the data exists, with retraction committed in advance if any of them fires.

---

## Why I ended up here

I am not a selectionist by temperament. Left to my own devices, I would derive first and measure to confirm. The research program I described in later posts in this series starts in selectionist mode — many variants, preregistered kills, retrospective naming — not because I chose it as my preferred mode, but because the prior over failure modes was genuinely uniform at the start.

When you do not know whether a compression scheme will fail because of algebraic structure, depth-composition effects, or distributional mismatch, breadth-first is the correct strategy. Running many controlled probes and letting the kills reveal the failure structure is what the biology labs at IISER were doing — not because biologists are undisciplined, but because the system they study does not submit to theoretical derivation up front.

That is also the position I was in at the start of this compression research. The selectionist phase was the right tool. Understanding *why* it was right — which required actually understanding what experimental design is for in complex systems — took longer.

The discipline from pharma is available to ML researchers. The tools — pre-registration, held-out evaluation, control conditions, pre-specified decision rules — are not technically difficult. The obstacle is that ML research has not yet developed the norm that these things are required. In medicine, a trial without a control arm would not be published. In ML, a paper without a control seed is standard.

The rest of this series is the specific machinery: how hypothesis testing works, how to translate the frequentist structure into a Bayesian decision procedure, and what the daily practice looks like.

---

*Next: [Hypothesis Testing from Scratch, and Its Bayesian Analogue](/blog/2026-04-27-frequentist-bayesian-ml-experiments/)*
