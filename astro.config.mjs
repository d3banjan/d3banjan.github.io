// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { devEditorPlugin } from './src/plugins/devEditor.ts';

// https://astro.build/config
export default defineConfig({
	site: 'https://d3banjan.github.io',
	integrations: [mdx(), svelte(), sitemap()],
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	vite: {
		plugins: [devEditorPlugin()],
	},
	redirects: {
		'/software/2016/04/18/recordmydesktop-notes': '/',
		'/sitemap.xml': '/sitemap-index.xml',
	},
});
