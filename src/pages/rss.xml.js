import rss from '@astrojs/rss';
import { getPublishedPosts, SITE_DESCRIPTION, SITE_TITLE } from '../consts';

const SITE_URL = 'https://d3banjan.github.io';

export async function GET(context) {
	const posts = await getPublishedPosts();
	// Sort newest first
	const sorted = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: {
			atom: 'http://www.w3.org/2005/Atom',
		},
		// atom:link self-reference for feed readers
		customData: `<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
		items: sorted.map((post) => {
			const postUrl = `${SITE_URL}/blog/${post.id}/`;
			// Canonical backlink in first paragraph — survives Medium import truncation.
			// Bengali Unicode preserved as raw UTF-8 inside CDATA; no entity escaping.
			const content = [
				`<p>Originally published at <a href="${postUrl}">${postUrl}</a></p>`,
				`<p>${post.data.description}</p>`,
			].join('\n');
			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.pubDate,
				link: postUrl,
				// content:encoded — excludes Svelte components and toggle UI by design
				content,
			};
		}),
	});
}
