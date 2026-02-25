// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { devEditorPlugin } from './src/plugins/devEditor.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://d3banjan.github.io',
	integrations: [mdx(), svelte(), sitemap()],
	vite: {
		plugins: [devEditorPlugin()],
	},
	redirects: {
		'/software/2016/04/18/recordmydesktop-notes': '/',
		'/sitemap.xml': '/sitemap-index.xml',
	},
});
