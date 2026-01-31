<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		x: number;
		y: number;
		visible: boolean;
		children?: Snippet;
	}

	let { x = 0, y = 0, visible = false, children }: Props = $props();

	let tooltipEl: HTMLDivElement | undefined = $state();
	let adjustedX = $state(0);
	let adjustedY = $state(0);

	$effect(() => {
		if (!tooltipEl || !visible) return;
		const rect = tooltipEl.getBoundingClientRect();
		const parentRect = tooltipEl.offsetParent?.getBoundingClientRect();
		if (!parentRect) return;

		let nx = x;
		let ny = y - rect.height - 8;

		// Keep within parent bounds
		if (nx + rect.width > parentRect.width) nx = parentRect.width - rect.width - 4;
		if (nx < 0) nx = 4;
		if (ny < 0) ny = y + 16;

		adjustedX = nx;
		adjustedY = ny;
	});
</script>

{#if visible}
	<div
		class="tooltip"
		bind:this={tooltipEl}
		style:left="{adjustedX}px"
		style:top="{adjustedY}px"
	>
		{@render children?.()}
	</div>
{/if}

<style>
	.tooltip {
		position: absolute;
		background: rgb(var(--gray-dark));
		color: rgb(var(--gray-light));
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 0.8em;
		line-height: 1.4;
		pointer-events: none;
		white-space: nowrap;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
	}
</style>
