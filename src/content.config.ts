import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogSchema = ({ image }: Parameters<Parameters<typeof defineCollection>[0]['schema']>[0]) =>
	z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: image().optional(),
		tags: z.array(z.string()).default([]),
		series: z.string().optional(),
		seriesOrder: z.number().optional(),
		// Required, no default: every post must make an explicit provenance claim.
		// A default would silently mislabel, which defeats the point of the label.
		provenance: z.enum([
			'human-written',
			'human-research-ai-written',
			'ai-drafted',
			'ai-translated',
			'ai-written',
		]),
	});

const blog = defineCollection({
	// Top-level only — bn/ subdirectory is its own collection
	loader: glob({ base: './src/content/blog', pattern: '*.{md,mdx}' }),
	schema: blogSchema,
});

const bn = defineCollection({
	loader: glob({ base: './src/content/blog/bn', pattern: '*.{md,mdx}' }),
	schema: ({ image }) =>
		blogSchema({ image }).extend({
			lang: z.literal('bn'),
		}),
});

export const collections = { blog, bn };
