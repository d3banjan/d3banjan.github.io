// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import { getCollection } from 'astro:content';

/** Return blog posts whose pubDate is not in the future. In dev mode, returns all posts. */
export async function getPublishedPosts() {
	if (import.meta.env.DEV) return getCollection('blog');
	const now = new Date();
	return getCollection('blog', ({ data }) => data.pubDate <= now);
}

export const SITE_TITLE = 'Debanjan Basu';
export const SITE_DESCRIPTION = 'Senior Software Engineer - ML & Data Systems. Blog and portfolio.';

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
};
