#set page(
  paper: "a4",
  margin: (top: 1.4cm, bottom: 1.4cm, left: 1.6cm, right: 1.6cm),
)
#set text(font: "Liberation Serif", size: 10pt, lang: "en")
#set par(leading: 0.55em)
#show link: underline

// ── colours ──────────────────────────────────────────────────────────────────
#let accent = rgb("#2563eb")

// ── helpers ──────────────────────────────────────────────────────────────────
#let section(title) = {
  v(0.55em)
  text(weight: "bold", size: 10.5pt, fill: accent, upper(title))
  line(length: 100%, stroke: 0.5pt + accent)
  v(0.2em)
}

#let job(title, company, dates, extra: none, body) = {
  grid(
    columns: (1fr, auto),
    text(weight: "bold", title),
    text(fill: accent, size: 9.5pt, dates),
  )
  text(style: "italic", fill: luma(90), company)
  if extra != none {
    linebreak()
    text(size: 9pt, fill: luma(100), extra)
  }
  body
  v(0.3em)
}

#let paper-entry(title, url, year, note: none, body) = {
  grid(
    columns: (1fr, auto),
    link(url, text(weight: "bold", title)),
    text(fill: accent, size: 9.5pt, year),
  )
  if note != none { text(size: 9pt, style: "italic", fill: luma(90), note); linebreak() }
  body
  v(0.25em)
}

// ── header ───────────────────────────────────────────────────────────────────
#text(size: 22pt, weight: "bold")[Debanjan Basu]
#v(0.1em)
#text(size: 11pt, fill: accent)[Independent ML Researcher · Formal Methods · Production Engineering]
#v(0.3em)
#text(size: 9.5pt, fill: luma(80))[
  debanjan.basu.ds\@gmail.com · Berlin, Germany ·
  #link("https://github.com/d3banjan")[github.com/d3banjan] ·
  #link("https://huggingface.co/d3banjan")[huggingface.co/d3banjan] ·
  #link("https://d3banjan.github.io")[d3banjan.github.io]
]

// ── profile ──────────────────────────────────────────────────────────────────
#section("Profile")

Independent ML researcher specialising in neural network compression, formal verification
(Lean 4 / Mathlib), and empirical methodology for falsifiable ML claims. Currently
investigating MoE weight quantization with Lean-verified invariants across Gemma-4,
DeepSeek-MoE, and OLMoE architectures. Six years of production Python and data
engineering. Physics background from the Indian Institute of Science Education and
Research (IISER) Kolkata; doctoral research in computational condensed matter physics at
TU Clausthal under Prof. Peter E. Blöchl (inventor of the PAW method).

// ── research ─────────────────────────────────────────────────────────────────
#section("Research")
#text(size: 9pt, style: "italic", fill: luma(90))[Independent research, Oct 2025 – present]
#v(0.25em)

#paper-entry(
  "Phase-Collapse Defragmentation: A Moment-Ratio Framework for 1-Bit KV-Cache Quantization in MoE Transformers",
  "https://moe-gauge-paper.pages.dev",
  "2026",
  note: "arXiv submission pending",
)[
  #list(
    tight: true,
    [Learned orthogonal rotation lifts moment-ratio cosine β from SRHT floor (0.80) to 0.92–0.97 across four architectures (Gemma-4 e2b/e4b/26B-MoE, DeepSeek-MoE-16B, OLMoE-1B-7B)],
    [Discovered Stiefel frustration: MoE expert banks resist single-rotation alignment at β ≈ 0.83],
    [74 Lean 4 theorems proved (Mathlib); includes convergence bounds and quadratic last-mile hardness],
  )
]

#paper-entry(
  "Low Stable-Rank Structure in LoRA-DPO Adapters on Pythia 70M–1B: Empirical Scaling and Formal Invariants",
  "https://d3banjan.github.io/lazy-rudder-paper",
  "2026",
  note: "arXiv submission pending",
)[
  #list(
    tight: true,
    [Stable rank ≈ 3.6 floor across 4× width scaling under fixed LoRA-DPO recipe],
    [Geometry–behaviour decoupling: γ-overlap does not predict reward margin],
    [Lean-verified: #raw("stableRank_smul_invariant"), #raw("rsLoraUpdate_frob_bounded")],
    [All adapter checkpoints released on HuggingFace (≈1.9 GB)],
  )
]

#paper-entry(
  "Symmetry Survey for Verified Neural Compilation",
  "https://symmetry-survey-paper.pages.dev",
  "2026",
  note: "in progress",
)[
  #list(
    tight: true,
    [Catalog of transformer weight symmetries (RoPE-commuting rotations, sign/phase gauges, parabolic stabilizers) with Lean 4 companion],
  )
]

#text(weight: "bold")[The Compression Falsification Ladder]
#h(0.5em)
#link("https://compression-ladder-paper.pages.dev/")[compression-ladder-paper.pages.dev]
#v(0.2em)
#list(
  tight: true,
  [Pre-registered empirical methodology for honest compression research: SHA-locked protocols, trap-cell adversarial validation, τ-hardened random baselines, kill-fast sequential design],
  [Applied to 10+ compression rungs on OLMoE-1B-7B; 7 clean kills, 1 deepen-strict result (per-channel INT4), 1 impact-rung in flight],
)

// ── publications ─────────────────────────────────────────────────────────────
#section("Publications")

*Peer-reviewed*
#v(0.2em)
Basu, D. & Blöchl, P.E. (2016). Phonon dynamics and thermoelectric transport in thermoelectric materials. _Physica Status Solidi A_. #link("https://doi.org/10.1002/pssa.201532488")[DOI: 10.1002/pssa.201532488]

#v(0.3em)
*Preprints (2026)*
#v(0.15em)
Basu, D. Phase-Collapse Defragmentation: A Moment-Ratio Framework for 1-Bit KV-Cache Quantization in MoE Transformers. _arXiv_ (pending).

Basu, D. Low Stable-Rank Structure in LoRA-DPO Adapters on Pythia 70M–1B: Empirical Scaling and Formal Invariants. _arXiv_ (pending).

// ── experience ───────────────────────────────────────────────────────────────
#section("Experience")

#job(
  "Senior ML & Data Engineer",
  "Nexern GmbH, Berlin",
  "Aug 2020 – Jul 2026",
)[
  #list(
    tight: true,
    [Led greenfield GenAI agent projects: LLM-based prediction pipelines and automated web data extraction],
    [Built LLM agent observability with Arize Phoenix; trajectory analysis for agent debugging],
    [Achieved 5–10× pipeline speedups via Dask distributed processing, Celery task queues, and vectorised operations],
    [Built and maintained Django data platform; large-scale JSON ingestion and web crawlers],
    [Deployed agents with Docker on VPS; S3/MinIO storage; GitLab CI/CD],
    [Mentored junior developers; conducted code reviews],
  )
]

#job(
  "Data Scientist",
  "KUGU Home GmbH, Berlin",
  "May 2018 – Jul 2020",
)[
  #list(
    tight: true,
    [Developed physics-informed heat models (Fourier equation) and time series forecasting with TensorFlow/XGBoost],
    [Built online changepoint detection for anomaly detection in IoT boiler systems],
    [Co-developed IoT pipeline for hundreds of devices; deployed to OpenStack via Ansible],
    [Ensured GDPR compliance in data handling workflows],
  )
]

#job(
  "Doctoral Researcher (Physics)",
  "TU Clausthal (Institute for Theoretical Physics) & University of Göttingen",
  "Aug 2012 – Oct 2016",
  extra: "Supervisor: Prof. Peter E. Blöchl",
)[
  #list(
    tight: true,
    [Investigated phonon dynamics and thermoelectric transport via classical molecular dynamics],
    [Extended MD codebase (Fortran/C): force constant extraction, phonon bandstructure calculation, thermal transport properties],
    [Published in _Physica Status Solidi A_ (DOI: 10.1002/pssa.201532488)],
    [Tutored ab-initio electronic structure methods],
  )
]

// ── skills ───────────────────────────────────────────────────────────────────
#section("Skills")

#grid(
  columns: (1fr, 1fr),
  column-gutter: 1.5em,
  row-gutter: 0.4em,
  [*Research & Formal Methods*],
  [*Languages*],
  [#text(fill: accent, weight: "bold")[Lean 4], Mathlib, PyTorch, HuggingFace Transformers/Accelerate, LoRA/PEFT, quantisation (GPTQ, INT4/INT8), SVD/spectral methods],
  [Python, #text(fill: accent, weight: "bold")[Lean 4], Fortran, C, CUDA, Rust],
  [*ML / Deep Learning*],
  [*Infrastructure*],
  [PyTorch, TensorFlow, scikit-learn, XGBoost, Dask],
  [Docker, Kubernetes, AWS (S3, EC2), GitLab CI, Ansible, PostgreSQL],
)

// ── education ────────────────────────────────────────────────────────────────
#section("Education")

#job(
  "Doctoral research (not completed)",
  "University of Göttingen / TU Clausthal",
  "2012 – 2016",
)[]

#job(
  "B.S.–M.S. in Physics",
  "Indian Institute of Science Education and Research (IISER) Kolkata",
  "2007 – 2012",
)[]

// ── languages ────────────────────────────────────────────────────────────────
#section("Languages")

English (fluent) · German (B1) · Hindi (native) · Bengali (native)
