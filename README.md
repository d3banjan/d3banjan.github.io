# Debanjan Basu — ML Systems Engineer

LLM agent observability, distributed pipelines, neural network compression research.
Source for [d3banjan.github.io](https://d3banjan.github.io).

## Experiment artifacts (external)

Research artifacts live in their own repos and microsites, not in this one.

- **Compression Falsification Ladder** — methodology and rungs: [compression-ladder-paper.pages.dev](https://compression-ladder-paper.pages.dev)
- **KV-Cache Quantization in MoE** — moment-ratio framework, Lean 4 proofs: [moe-gauge-paper.pages.dev](https://moe-gauge-paper.pages.dev)
- **LoRA-DPO Stable Rank** — srank geometry, Lean-verified invariants, adapter checkpoints (~1.9 GB on HuggingFace): [d3banjan.github.io/lazy-rudder-paper](https://d3banjan.github.io/lazy-rudder-paper)
- **Symmetry Survey** — algebraic invariants for compression: [symmetry-survey-paper.pages.dev](https://symmetry-survey-paper.pages.dev)

## Engineering surface

- **LLM agent observability** with Arize Phoenix — trajectory analysis for production agent debugging. Write-up: [/series/methodology-transition/](https://d3banjan.github.io/series/methodology-transition/)
- **Distributed pipelines** — Dask, Celery; 5–10× speedup on internal data workloads
- **Agent security** — type-stub gates for ML deserialization: [/series/falcon-security/](https://d3banjan.github.io/series/falcon-security/)

## Research methodology

Series: [/series/methodology-transition/](https://d3banjan.github.io/series/methodology-transition/)
External companion: [compression-ladder-paper.pages.dev](https://compression-ladder-paper.pages.dev)

## Site dev

Built with [Astro](https://astro.build). Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev      # localhost:4321
bun run build    # ./dist/
bun run preview
```

CV is compiled from `src/cv/cv.typ` via [Typst](https://typst.app) and served at `/cv.pdf`.
