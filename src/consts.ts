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
export const SITE_DESCRIPTION = 'Independent ML researcher. Neural network compression, Lean 4 formal verification, falsifiable empirical methodology. Physics background. Berlin.';

export const SERIES_META: Record<string, { slug: string; description: string }> = {
	'Production Django Task Queue': {
		slug: 'django-task-queue',
		description:
			'Building a ~300 LOC task queue on Django ORM from prototype to production — memory leaks, fork pitfalls, pessimistic locking, and security hardening.',
	},
	'Terminal Power User': {
		slug: 'terminal-power-user',
		description:
			'Kitty terminal, kittens, shell integration, Starship prompt, and turning the terminal into a complete development environment.',
	},
	'Wayland Desktop Mastery': {
		slug: 'wayland-desktop-mastery',
		description:
			"Niri's scrolling paradigm, unified shortcuts across compositors, DankMaterialShell, and building a cohesive Wayland desktop.",
	},
	"Berlin's Transit Crisis": {
		slug: 'berlin-transit-crisis',
		description:
			"How reunification, austerity, broken funding, and low wages created BVG's crisis — and what proven European models show about the way out.",
	},
	'A Deep History of Bengali Culture': {
		slug: 'bengali-deep-history',
		description:
			'আদি বাঙালি ইত্যাদি — A personal journey through the deep history of the Bengali language: the people, migrations, and forgotten civilizations folded into the words we use every day.',
	},
	'Falsifying LoRA Alignment Geometry': {
		slug: 'lora-alignment-geometry',
		description:
			'Building a paper that tries to kill itself: srank as an overfitting signature in DPO fine-tuning, manuscript-as-code, adversarial passes that retracted two claims, and an interactive microsite as the publication artifact.',
	},
	'Compressing MoE Without Lying To Yourself': {
		slug: 'moe-compression',
		description:
			'Phase-collapse defragmentation, moment-ratio bounds, FFN pivots, and zero-sorry Lean 4 theorems — a research arc through 1-bit KV-cache quantization on OLMoE-1B-7B.',
	},
	'A Survey of Symmetries Compression Must Respect': {
		slug: 'symmetry-survey',
		description:
			'RoPE, SignPhase, BoundedArithmetic, DenseSparse, dormancy — a living catalogue of algebraic invariants that any compression scheme must preserve, with Lean 4 formal coverage.',
	},
	'Type-Stub Security Gates for ML Deserialization': {
		slug: 'falcon-security',
		description:
			'Pickle is a CVE factory. falcon-secure uses Python type stubs and Lean 4 soundness proofs to gate unsafe deserialization at the type-checker level.',
	},
	'Notes on a Methodology Transition': {
		slug: 'methodology-transition',
		description:
			'Moving from selectionist ML research (run many probes, kill the bad ones) to physicist-mode research (theorem first, two parameters per probe, universality over coverage). A live chronicle.',
	},
};
