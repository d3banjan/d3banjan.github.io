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
		category: 'engineering',
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
};

export const ENGINEERING_TAGS = new Set([
	'ai-agents',
	'automation',
	'claude-code',
	'debugging',
	'developer-tools',
	'django',
	'evals',
	'linux',
	'llm',
	'ml-ops',
	'networking',
	'python',
	'security',
	'software-engineering',
	'terminal',
	'tooling',
	'workflow',
]);
