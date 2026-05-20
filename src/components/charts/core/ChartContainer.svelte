<script lang="ts">
	import { type Snippet } from 'svelte';


	interface Props {
		title?: string;
		aspectRatio?: number;
		minHeight?: number;
		children?: Snippet<[{ width: number; height: number }]>;
	}

	let { title = '', aspectRatio = 0.5, minHeight = 200, children }: Props = $props();

	let containerWidth = $state(600);
	let containerEl: HTMLDivElement | undefined = $state();

	let activeWidth = $derived(containerWidth || 600);
	let height = $derived(Math.max(minHeight, activeWidth * aspectRatio));

</script>

<figure class="chart-container" bind:this={containerEl} bind:clientWidth={containerWidth}>
	{#if title}
		<figcaption class="chart-title">{title}</figcaption>
	{/if}
	<div class="chart-body" style:height="{height}px">
		{@render children?.({ width: activeWidth, height })}
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
