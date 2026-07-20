---
title: 'The Microsite as Interactive Publication'
description: 'Building a GitHub Pages research microsite with d3 widgets, a Lean 4 theorem status page, and a reproducibility shim. One gotcha with Jekyll and markdown-inside-divs. One real answer to whether live widgets are worth the effort.'
pubDate: 'Apr 24 2026'
tags: ["ml-research", "d3", "jekyll", "lean4", "reproducibility", "visualization"]
series: "Falsifying LoRA Alignment Geometry"
seriesOrder: 4
provenance: human-research-ai-written
---

A static PDF is a strange way to publish interactive research. The figures are frozen at whatever resolution the author chose. The reader can't change axes, filter by model size, or ask "what does this look like for layer 6 specifically?" The author anticipated every question wrong.

The clearest precedent for doing this differently is the [Transformer Circuits](https://transformer-circuits.pub/) thread from Anthropic. Their papers live on a website, not in a PDF. The figures are interactive. The reader can trace a circuit, expand a diagram, zoom into attention heads. The website *is* the paper, not a supplement to it. That's the design target.

For this project we built a GitHub Pages microsite alongside the paper. This post is about what went into it, one concrete gotcha with Jekyll that cost an hour, and an honest assessment of when interactive figures justify the engineering time.

---

## The skeleton

Jekyll on GitHub Pages, not a modern bundled framework. The reasoning: no build step other than Jekyll's own build, no Node.js dependency tree to maintain, deploys on `git push`. For a research microsite with an indefinite maintenance horizon (or more realistically, no maintenance), this matters. A Next.js site from 2026 will have broken dependencies in 2028. A Jekyll site with static JSON and vanilla d3 will still work.

Directory structure:

```
lazy-rudder-paper/  (GitHub Pages source)
├── _config.yml
├── _layouts/
│   ├── default.html
│   ├── paper.html        ← wider content area, fewer nav elements
│   └── theorem.html      ← fixed-width, monospace-adjacent
├── _includes/
│   ├── figure_controls.html
│   └── lean_badge.html
├── assets/
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   ├── figA_srank.js
│   │   ├── figB_bonus_r.js
│   │   └── figE_gamma.js
│   └── data/
│       ├── srank_results.json
│       ├── bonus_r_results.json
│       └── gamma_results.json
├── index.md
├── figures.md
├── theorems.md
└── reproduce.md
```

The `assets/data/` JSON files are symlinked from the experiment result directories — the same files the macro generator reads when building the paper. Same single source of truth, different consumer.

---

## The three d3 widgets

### figA: srank scatter

The main result figure. Each point is one (model, objective, layer, checkpoint) combination. The user can set:

- X-axis: training step, epoch, or final checkpoint srank
- Y-axis: srank value, or $\Delta$srank from initialization
- Color: model size (70M / 1B) or training objective (CLM / DPO)
- Filter: specific LoRA target module (query / key / value / dense / MLP-up / MLP-down)

The filtering is why this had to be interactive. The paper has a single static scatter that aggregates over modules. But the srank story is *different per module* — the attention dense projection behaves differently from the MLP projections, which behave differently from QKV. A static figure either picks one module (misleading) or overlays all of them (unreadable).

The d3 code is about 200 lines. The interesting part is the update pattern — we use a single `update()` function that rebinds data to the selection based on current filter state, so the transition is smooth rather than a full redraw:

```javascript
function update() {
  const filtered = data.filter(d =>
    (state.module === "all" || d.module === state.module) &&
    (state.objective === "all" || d.objective === state.objective)
  );

  const dots = svg.selectAll("circle").data(filtered, d => d.id);

  dots.enter().append("circle")
      .attr("r", 4)
      .attr("opacity", 0)
    .merge(dots)
      .transition().duration(300)
      .attr("cx", d => xScale(d[state.xAxis]))
      .attr("cy", d => yScale(d[state.yAxis]))
      .attr("fill", d => colorScale(d[state.color]))
      .attr("opacity", 0.75);

  dots.exit().transition().duration(150).attr("opacity", 0).remove();
}
```

No React, no Vue, no state management library. The filter state is a plain JS object. The controls are plain `<select>` elements with `addEventListener("change", update)`. This runs in any browser without a build step.

### figB: bonus\_R per-layer curves

$\gamma$ (gamma) is the ratio we use to characterize how well a LoRA adapter's singular-value spectrum fits a power-law model. A high $\gamma$ means the spectrum decays slowly — the adapter is spreading its capacity across many directions. A low $\gamma$ means the spectrum is spiky, concentrated in a few directions.

figB shows $\gamma$ as a function of layer index, with separate curves for each training objective and model size. This is a line chart, not a scatter. The interesting thing is not a single value but the *shape* of the curve — does $\gamma$ decrease monotonically with depth, or does it have a dip in the middle layers?

The plot is static in the paper (one model, one objective, one representative training step). The widget lets the user sweep over training steps to watch the curve evolve during training. This reveals something the static figure hides: in the early training steps, CLM and DPO have nearly identical $\gamma$ profiles. The divergence happens around step 500, which coincides with the point where validation loss curves start to separate.

### figE: gamma modules small-multiples

The $\gamma$ analysis was originally done only for attention (QKV) layers. We extended it to all six LoRA target module types. figE is a small-multiples grid — one panel per module type, $\gamma$ vs layer, CLM vs DPO overlaid.

Small multiples don't need interactivity; the whole point is to see all four panels simultaneously. The d3 here is straightforward: a `forEach` over module types, each creating an SVG with shared scales.

```javascript
const modules = ["query", "key", "value", "dense", "mlp_up", "mlp_down"];
const panelWidth = 200, panelHeight = 150;

modules.forEach((mod, i) => {
  const x = (i % 3) * (panelWidth + 20);
  const y = Math.floor(i / 3) * (panelHeight + 40);

  const panel = svg.append("g").attr("transform", `translate(${x},${y})`);
  // ... draw axes, CLM line, DPO line, module label
});
```

---

## The Jekyll gotcha

Jekyll uses Kramdown for Markdown parsing. By default, Kramdown does not process Markdown inside HTML blocks. This means:

```markdown
<div class="figure-container">
**This bold text will not render.**
</div>
```

The `**...**` will appear as literal asterisks, not bold text, because Kramdown sees the outer `<div>` and stops parsing Markdown inside it.

The fix is one line in `_config.yml`:

```yaml
kramdown:
  parse_block_html: true
```

With this set, Kramdown processes Markdown inside block-level HTML elements. Every figure caption, every callout div, every methodology box that uses Markdown formatting inside an HTML wrapper now renders correctly.

This took longer to find than it should have. The symptom was confusing: the site built without error, the HTML was in the output, but the formatting inside divs was missing. The `parse_block_html` option is documented but not prominent.

---

## The Lean theorem status page

The paper includes machine-checked bounds on the geometry of LoRA updates, written in Lean 4 (a proof assistant whose compiler verifies every step). The theorem page tracks which theorems are fully proved, which still have placeholder `sorry` admissions, and which are in progress.

```
theorems.md → rendered by theorem.html layout
```

The layout shows a table:

| Theorem | Statement (informal) | Status |
|---------|---------------------|--------|
| T1.1 | Srank lower bound under rank-r LoRA | Proved |
| T1.2 | Frobenius concentration inequality | Proved |
| T2.1 | Orthogonality bound (DPO vs CLM) | Retracted (experimental falsification) |
| T3.1 | γ power-law exponent bound | Proved |

The "Retracted" entry for T2.1 is important. The theorem was stated about a mechanism that was empirically falsified — the orthogonal-complement hypothesis described in [Adversarial Passes That Killed Claims](/blog/2026-04-22-lora-adversarial-passes/). A formally proved theorem about a false mechanism is still a true theorem — the math is correct — but the theorem is no longer a theorem *about something real*. The retraction flag makes this explicit.

The status page is generated from a `theorems.json` file, same pattern as the experiment results:

```json
[
  {
    "id": "T1.1",
    "informal": "Srank lower bound under rank-r LoRA",
    "status": "proved",
    "sorry_count": 0
  },
  ...
]
```

A small JavaScript snippet at build time renders this into the table. The Lean badge in the header shows overall proof completeness: proved / total.

---

## The reproducibility shim

The `reproduce.md` page describes how to run every experiment in the paper from a clean environment:

```bash
# 1. Create a clean environment
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Download checkpoints from HuggingFace mirror
python scripts/download_checkpoints.py --model pythia-70m --model pythia-1b

# 3. Run all experiments (GPU required for full run)
make experiments

# 4. Rebuild the paper
make paper
```

The HuggingFace mirror is important. The canonical EleutherAI Pythia checkpoints will exist as long as EleutherAI maintains them, which may not be forever. We maintain a mirror of the specific checkpoint versions used in the paper so results remain reproducible even if the canonical source changes.

`download_checkpoints.py` uses the HuggingFace Hub API and checks SHA256 hashes of downloaded files against a lockfile. If the file exists and the hash matches, it skips the download. Same principle as the macro lockfile: a checksum-verified artifact store.

---

## Was the interactive layer worth it?

For figB and figE: probably not, for a paper this size. The static versions in the paper carry the main result. A careful reader can reconstruct the training dynamics from the appendix tables. The widgets are nice for exploration but don't change the conclusions.

For figA: yes. The scatter with module filtering reveals a pattern — the srank divergence between DPO and CLM is concentrated in specific module types — that we could not have shown clearly in a static figure without either picking one module (misleading) or making a 6-panel figure too small to read (unreadable). The interactive filter *changed what we could claim*.

The heuristic: a widget is worth building if it makes a specific claim *visible* that couldn't be shown in a static figure at the space budget a paper affords. If it's just a prettier version of the static figure, skip it.

---

The live microsite, Lean theorem status, and reproducibility instructions are at the project's GitHub Pages URL. The Lean source is in the repository under `lean/`. All proofs targeting zero sorrys; current status visible on the theorem page.

The full series: [stable rank as overfitting signature](/blog/2026-04-18-lora-srank-overfitting/) → [manuscript as codebase](/blog/2026-04-19-lora-manuscript-as-code/) → [claims that died](/blog/2026-04-22-lora-adversarial-passes/) → this post.
