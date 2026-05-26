// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import { getCollection } from 'astro:content';

/** Return blog posts whose pubDate is not in the future. In dev mode, returns all posts. */
export async function getPublishedPosts() {
	if (import.meta.env.DEV) return getCollection('blog');
	const now = new Date();
	return getCollection('blog', ({ data }) => data.pubDate <= now);
}

/** Return Bengali posts whose pubDate is not in the future. In dev mode, returns all. */
export async function getPublishedBnPosts() {
	if (import.meta.env.DEV) return getCollection('bn');
	const now = new Date();
	return getCollection('bn', ({ data }) => data.pubDate <= now);
}

export const SITE_TITLE = 'Debanjan Basu';
export const SITE_DESCRIPTION = 'ML systems engineer. LLM agent observability (Arize Phoenix), distributed data pipelines (Dask, Celery), independent research in neural network compression and Lean 4 formal verification. Berlin.';

export type ContentCategory = 'research' | 'engineering' | 'blog';

export const SERIES_META: Record<string, { slug: string; description: string; category: ContentCategory }> = {
	'Production Django Task Queue': {
		slug: 'django-task-queue',
		category: 'engineering',
		description:
			'Building a ~300 LOC task queue on Django ORM from prototype to production — memory leaks, fork pitfalls, pessimistic locking, and security hardening.',
	},
	'Terminal Power User': {
		slug: 'terminal-power-user',
		category: 'engineering',
		description:
			'Kitty terminal, kittens, shell integration, Starship prompt, and turning the terminal into a complete development environment.',
	},
	'Wayland Desktop Mastery': {
		slug: 'wayland-desktop-mastery',
		category: 'blog',
		description:
			"Niri's scrolling paradigm, unified shortcuts across compositors, DankMaterialShell, and building a cohesive Wayland desktop.",
	},
	"Berlin's Transit Crisis": {
		slug: 'berlin-transit-crisis',
		category: 'blog',
		description:
			"How reunification, austerity, broken funding, and low wages created BVG's crisis — and what proven European models show about the way out.",
	},
	'A Deep History of Bengali Culture': {
		slug: 'bengali-deep-history',
		category: 'blog',
		description:
			'আদি বাঙালি ইত্যাদি — A personal journey through the deep history of the Bengali language: the people, migrations, and forgotten civilizations folded into the words we use every day.',
	},
	'Falsifying LoRA Alignment Geometry': {
		slug: 'lora-alignment-geometry',
		category: 'research',
		description:
			'Building a paper that tries to kill itself: srank as an overfitting signature in DPO fine-tuning, manuscript-as-code, adversarial passes that retracted two claims, and an interactive microsite as the publication artifact.',
	},
	'Compressing MoE Without Lying To Yourself': {
		slug: 'moe-compression',
		category: 'research',
		description:
			'Phase-collapse defragmentation, moment-ratio bounds, FFN pivots, and zero-sorry Lean 4 theorems — a research arc through 1-bit KV-cache quantization on OLMoE-1B-7B.',
	},
	'A Survey of Symmetries Compression Must Respect': {
		slug: 'symmetry-survey',
		category: 'research',
		description:
			'RoPE, SignPhase, BoundedArithmetic, DenseSparse, dormancy — a living catalogue of algebraic invariants that any compression scheme must preserve, with Lean 4 formal coverage.',
	},
	'Type-Stub Security Gates for ML Deserialization': {
		slug: 'falcon-security',
		category: 'engineering',
		description:
			'Pickle is a CVE factory. falcon-secure uses Python type stubs and Lean 4 soundness proofs to gate unsafe deserialization at the type-checker level.',
	},
	'Notes on a Methodology Transition': {
		slug: 'methodology-transition',
		category: 'research',
		description:
			'Moving from selectionist ML research (run many probes, kill the bad ones) to physicist-mode research (theorem first, two parameters per probe, universality over coverage). A live chronicle.',
	},
	'Job Search Journal': {
		slug: 'job-search-journal',
		category: 'blog',
		description:
			'Daily log of the RE/MTS job search: decisions made, applications sent, outreach, and what changed each day. Berlin → frontier labs.',
	},
	'ML Systems Reference': {
		slug: 'ml-systems-reference',
		category: 'engineering',
		description:
			'Concise explainers on distributed training, LLM infrastructure, and ML systems — written to consolidate interview prep and demonstrate depth.',
	},
	'The Geometry of MoE Compression (Part E)': {
		slug: 'moe-compression-part-e',
		category: 'research',
		description:
			'Expanding on Phase-Collapse: β transfer in FFNs, formal Softmax soundness, and recovering dense performance from quantized layers.',
	},
	'Verified Neural Compilation': {
		slug: 'verified-neural-compilation',
		category: 'research',
		description:
			'Classifying the RoPE commutant, multi-head foldability, and formalizing the architectural boundaries of key-only routing.',
	},
	'RoPE-Provenance: Encoding Token Roles': {
		slug: 'rope-provenance',
		category: 'research',
		description:
			'Using RoPE subspaces to separate instruction from data: learnable role-angles, counterfactual experiments, and Phase 5 benchmarks.',
	},
	'Infrastructure for Frontier Research': {
		slug: 'research-infrastructure',
		category: 'engineering',
		description:
			'Systems for high-performance ML research: HF-streaming for large artifacts and the dual-emit data-driven paper pattern.',
	},
};

export const ENGINEERING_TAGS = new Set([
	'ai-agents',
	'automation',
	'claude-code',
	'debugging',
	'developer-tools',
	'django',
	'evals',
	'llm',
	'ml-ops',
	'networking',
	'python',
	'security',
	'software-engineering',
	'tooling',
]);

export interface ResearchPaper {
	title: string;
	description: string;
	siteUrl: string;
	seriesUrl: string;
	repoUrl?: string;
	hfUrl?: string;
	meta?: string;
	bullets: string[];
}

export const PAPERS: ResearchPaper[] = [
	{
		title: 'Phase-Collapse Defragmentation: Provable Bounds on 1-bit KV-Cache Quantization in MoE',
		description: 'Moment-ratio gauge construction that determines — from weight statistics alone, before inference — whether 1-bit KV-cache quantization is achievable for a given layer. MoEGauge and JensenFloor theorems proved in Lean 4 with zero sorries. Evaluated on OLMoE-1B-7B.',
		siteUrl: 'https://moe-gauge-paper.pages.dev/',
		seriesUrl: '/series/moe-compression/',
		repoUrl: 'https://github.com/d3banjan',
		meta: '2026 · preprint microsite with Lean source',
		bullets: [
			'Learned orthogonal rotation lifts moment-ratio cosine β from SRHT floor (0.80) to 0.92–0.97 across four architectures (Gemma-4 e2b/e4b/26B-MoE, DeepSeek-MoE-16B, OLMoE-1B-7B)',
			'Discovered Stiefel frustration: MoE expert banks resist single-rotation alignment at β ≈ 0.83',
			'74 Lean 4 theorems proved (Mathlib); includes convergence bounds and quadratic last-mile hardness'
		]
	},
	{
		title: 'Verified Neural Compilation: Formal Symmetries and Impossibility Boundaries',
		description: 'Machine-checked proofs of RoPE commutant classification and block-diagonal frequency boundaries in Lean 4. Formalizing zero-cost compilation invariants and proving the impossibility of key-only routing under standard MoE interfaces.',
		siteUrl: 'https://symmetry-survey-paper.pages.dev/',
		seriesUrl: '/series/verified-neural-compilation/',
		repoUrl: 'https://github.com/d3banjan/lean-mining',
		meta: '2026 · preprint microsite with Lean source',
		bullets: [
			'Machine-checked proofs of RoPE commutant classification and block-diagonal frequency boundaries in Lean 4.',
			'Formalizing zero-cost compilation invariants and proving the impossibility of key-only routing under standard MoE interfaces.'
		]
	},
	{
		title: 'RoPE-Provenance: Subspace-Split Positional Encodings for Token-Role Auditing',
		description: 'Allocating a low-frequency subspace of RoPE positional encodings to serve as an out-of-band role channel. Applied to SmolLM2-135M to dynamically isolate instruction execution from untrusted data payloads. Pre-registered benchmarks evaluate selectivity (SEP scores) and instruct compliance under adversarial injection.',
		siteUrl: 'https://model-internals-microsite.pages.dev/',
		seriesUrl: '/series/rope-provenance/',
		repoUrl: 'https://github.com/d3banjan/rope-provenance',
		meta: '2026 · preprint microsite with Lean source',
		bullets: [
			'Allocating a low-frequency subspace of RoPE positional encodings to serve as an out-of-band role channel.',
			'Applied to SmolLM2-135M to dynamically isolate instruction execution from untrusted data payloads.',
			'Pre-registered benchmarks evaluate selectivity (SEP scores) and instruct compliance under adversarial injection.'
		]
	},
	{
		title: 'Falsifying LoRA Alignment Geometry: srank as Overfitting Signature in DPO Fine-Tuning',
		description: 'Pre-registered study of whether DPO fine-tuning leaves a geometrically distinct fingerprint in LoRA weight updates. Two claims killed: the orthogonal-complement hypothesis (directional violation) and cross-probe srank (length-bias artifact). Interactive microsite with d3 exploration widgets.',
		siteUrl: 'https://d3banjan.github.io/lazy-rudder-paper',
		seriesUrl: '/series/lora-alignment-geometry/',
		repoUrl: 'https://github.com/d3banjan',
		hfUrl: 'https://huggingface.co/d3banjan',
		meta: '2026 · preprint microsite with Lean source',
		bullets: [
			'Stable rank ≈ 3.6 floor across 4× width scaling under fixed LoRA-DPO recipe',
			'Geometry–behavior decoupling: γ-overlap does not predict reward margin',
			'Lean-verified: stableRank_smul_invariant, rsLoraUpdate_frob_bounded',
			'All adapter checkpoints released on HuggingFace (~1.9 GB)'
		]
	},
	{
		title: 'A Survey of Symmetries Compression Must Respect',
		description: 'Living catalogue of algebraic invariants — RoPE, SignPhase, BoundedArithmetic, DenseSparse, dormancy — that any compression scheme must preserve to avoid silent correctness failures. Lean 4 coverage across 152/161 symmetry claims.',
		siteUrl: 'https://symmetry-survey-paper.pages.dev/',
		seriesUrl: '/series/symmetry-survey/',
		meta: '2026 · in progress',
		bullets: [
			'Catalog of transformer weight symmetries (RoPE-commuting rotations, sign/phase gauges, parabolic stabilizers) with Lean 4 companion'
		]
	}
];
