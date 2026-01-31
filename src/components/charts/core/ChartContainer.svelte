<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import { writable } from 'svelte/store';

	interface Props {
		title?: string;
		aspectRatio?: number;
		minHeight?: number;
		children?: Snippet<[{ width: number; height: number }]>;
	}

	let { title = '', aspectRatio = 0.5, minHeight = 200, children }: Props = $props();

	let containerWidth = $state(0);
	let containerEl: HTMLDivElement | undefined = $state();

	const darkMode = writable(false);
	setContext('darkMode', darkMode);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		darkMode.set(mq.matches);
		const handler = (e: MediaQueryListEvent) => darkMode.set(e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	let height = $derived(Math.max(minHeight, containerWidth * aspectRatio));
</script>

<figure class="chart-container" bind:this={containerEl} bind:clientWidth={containerWidth}>
	{#if title}
		<figcaption class="chart-title">{title}</figcaption>
	{/if}
	<div class="chart-body" style:height="{height}px">
		{#if containerWidth > 0}
			{@render children?.({ width: containerWidth, height })}
		{/if}
	</div>
</figure>

<style>
	.chart-container {
		margin: 1.5em 0;
		padding: 0;
		width: 100%;
	}
	.chart-title {
		font-size: 0.9em;
		font-weight: 700;
		color: rgb(var(--gray-dark));
		margin-bottom: 0.5em;
		text-align: center;
	}
	.chart-body {
		position: relative;
		width: 100%;
	}
</style>
