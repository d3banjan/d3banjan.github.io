#set page(
  paper: "a4",
  margin: (top: 0.9cm, bottom: 0.9cm, left: 1.0cm, right: 1.0cm),
)

// ── palette ──────────────────────────────────────────────────────────────────
#let ink         = rgb("#0f172a")
#let mid         = rgb("#64748b")
#let rule        = rgb("#e2e8f0")
#let accent      = rgb("#1e3a8a")
#let warm        = rgb("#ea580c")
#let paper-tint  = rgb("#f8fafc")

#set text(font: "Roboto", size: 9pt, fill: ink, lang: "en")
#set par(leading: 0.48em)
#show link: it => text(fill: accent, it)

// ── helpers ──────────────────────────────────────────────────────────────────
#let mono(body) = text(font: "DejaVu Sans Mono", size: 7.5pt, fill: mid, body)

#let section(title) = {
  v(0.5em)
  text(font: "Roboto", weight: "bold", size: 8.5pt, fill: accent, upper(title))
  v(0.15em)
  line(length: 100%, stroke: 0.5pt + rule)
  v(0.25em)
}

#let metric(body) = text(fill: warm, weight: "semibold", body)

#let proj(name, url) = {
  grid(
    columns: (1fr, auto),
    text(font: "Roboto", weight: "bold", size: 10pt, fill: accent, name),
    mono(url),
  )
}

#let proj-body(body) = pad(left: 0.2em,
  block(
    stroke: (left: 2pt + accent),
    inset: (left: 0.6em, top: 0.2em, bottom: 0.2em),
    body
  )
)

#let exp(company, role-dates) = {
  text(weight: "bold", size: 9pt, fill: ink, company)
  linebreak()
  text(size: 8pt, fill: mid, role-dates)
  v(0.15em)
}

// ── sidebar content ──────────────────────────────────────────────────────────
#let sidebar = [
  #v(0.2em)
  #text(size: 9pt, fill: mid)[
    debanjan.basu.ds\@gmail.com \
    Berlin, Germany \
    #link("https://github.com/d3banjan")[github.com/d3banjan] \
    #link("https://d3banjan.github.io/engineering")[d3banjan.github.io/engineering]
  ]

  #v(0.8em)
  #section("Skills")

  #text(size: 8.5pt, weight: "bold", fill: ink)[Agent / Eval]
  #linebreak()
  #mono("Arize Phoenix · butterflow · LangChain · LlamaIndex · RAG · vector DBs · token economics")

  #v(0.5em)
  #text(size: 8.5pt, weight: "bold", fill: ink)[Distributed]
  #linebreak()
  #mono("Dask · Celery · Django · PostgreSQL · S3/MinIO · Docker · Kubernetes")

  #v(0.5em)
  #text(size: 8.5pt, weight: "bold", fill: ink)[ML / Research]
  #linebreak()
  #mono("PyTorch · HuggingFace · LoRA/PEFT · GPTQ · CUDA · Lean 4")

  #v(0.8em)
  #section("Education")

  #text(size: 9pt)[
    *B.S.–M.S. Physics* \
    IISER Kolkata, 2007–2012
  ]

  #v(0.4em)
  #text(size: 9pt)[
    *Doctoral research* (not completed) \
    TU Clausthal, 2012–2016
  ]

  #v(0.8em)
  #section("Languages")

  #text(size: 9pt)[
    English (fluent) · German (B1) \
    Hindi (native) · Bengali (native)
  ]
]

// ── main content ─────────────────────────────────────────────────────────────
#let main = [
  #v(0.2em)
  #text(size: 22pt, weight: "bold", fill: ink)[Debanjan Basu]
  #linebreak()
  #text(size: 9pt, fill: warm, tracking: 1.2pt)[#upper("Senior ML Engineer · Distributed Systems · LLM Observability")]

  #v(0.6em)
  #text(size: 9pt)[
    Six years production ML engineering at Nexern (Berlin): LLM agent observability (Arize Phoenix), distributed pipelines (Dask/Celery, #metric("5–10×") speedups), GenAI agent deployment. Built #text(fill: accent, weight: "semibold")[butterflow] — declarative agent eval framework with token caching between runs; #text(fill: accent, weight: "semibold")[falcon] gates unsafe ML deserialization at the type-checker level via Lean 4-verified typestubs.
  ]

  #section("Selected Projects")

  #proj("butterflow", "github.com/d3banjan/butterflow")
  #proj-body[
    #set text(size: 8.8pt)
    #list(tight: true, spacing: 0.35em,
      [CLI framework: declarative agent flow definitions, token caching between test runs, evals and cost optimization unified],
      [Same execution trace, cache aggressively, measure quality simultaneously — user-flow testing and token cost as one problem],
    )
  ]

  #v(0.3em)
  #proj("falcon", "github.com/d3banjan/falcon")
  #proj-body[
    #set text(size: 8.8pt)
    #list(tight: true, spacing: 0.35em,
      [Python typestubs tracking payload annotations by source to gate unsafe ML deserialization (pickle, HDF5) at the type-checker],
      [Born from huntr.com CVE research on serialization-route vulnerabilities in GenAI platforms; Lean 4 soundness proofs included],
    )
  ]

  #section("Experience")

  #exp("Nexern GmbH", "Senior ML & Data Engineer · Aug 2020–Jul 2026 · Berlin")
  #set text(size: 8.8pt)
  #list(tight: true, spacing: 0.3em,
    [Built in-house HR platform in #metric("3 months") — multi-entity, multi-jurisdiction across #metric("5 EU/EMEA countries"); Django/PostgreSQL, ADR + spec-driven sprints, invariants enforced across backend, frontend and DB],
    [Built LLM agent observability with Arize Phoenix; trajectory analysis for debugging agent failures in production],
    [Achieved #metric("5–10×") pipeline speedups via Dask distributed processing, Celery task queues, and vectorised operations],
    [Led greenfield GenAI agent projects: LLM-based prediction pipelines and automated web data extraction],
    [Django data platform: large-scale JSON ingestion, web crawlers, Docker deployment, GitLab CI/CD],
  )
  #set text(size: 9pt)

  #v(0.3em)
  #exp("KUGU Home GmbH", "Data Scientist · May 2018–Jul 2020")
  #set text(size: 8.8pt)
  #list(tight: true, spacing: 0.3em,
    [Physics-informed heat models and time series forecasting with TensorFlow/XGBoost],
    [IoT pipeline for hundreds of devices — online changepoint detection, OpenStack/Ansible deployment],
  )
  #set text(size: 9pt)

  #v(0.3em)
  #exp("TU Clausthal", "Doctoral Researcher · 2012–2016")
  #set text(size: 8.8pt)
  #list(tight: true, spacing: 0.3em,
    [Extended MD codebase (Fortran/C); published in _Physica Status Solidi A_ (DOI: 10.1002/pssa.201532488)],
  )
  #set text(size: 9pt)

  #section("Research")

  #text(size: 8.8pt)[
    Independent, Oct 2025–present. #metric("5 preprints") across MoE quantization, LoRA-DPO alignment geometry, RoPE provenance, symmetry survey, and compression methodology. #metric("74 Lean 4 theorems") (Mathlib).
  ]
  #linebreak()
  #link("https://d3banjan.github.io/research")[#mono("d3banjan.github.io/research")]
]

// ── page layout ──────────────────────────────────────────────────────────────
#place(
  top + left,
  dx: 0pt,
  dy: 0pt,
  block(fill: paper-tint, width: 33% + 1.0cm, height: 100%),
)

#place(
  top + left,
  dx: 33% + 1.0cm - 1.0cm,
  dy: 0pt,
  line(
    start: (0pt, 0pt),
    end: (0pt, 100%),
    stroke: 1pt + accent,
  ),
)

#grid(
  columns: (0.33fr, 0.67fr),
  gutter: 0em,
  pad(right: 0.7em, sidebar),
  pad(left: 0.9em, main),
)
