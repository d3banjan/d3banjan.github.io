// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://d3banjan.github.io',
	integrations: [mdx(), sitemap()],
	redirects: {
		'/software/2016/04/18/recordmydesktop-notes': '/',
		'/sitemap.xml': '/sitemap-index.xml',
	},
});
