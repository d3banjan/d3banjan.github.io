<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import Tooltip from './core/Tooltip.svelte';
	import { linearScale, niceScale, CHART_COLORS, pickFormat } from './core/utils.js';

	interface StackSegment {
		label: string;
		value: number;
		color?: string;
	}

	interface StackedBarDatum {
		label: string;
		segments: StackSegment[];
	}

	interface Props {
		data: StackedBarDatum[];
		title?: string;
		format?: string;
		/** Optional reference marker: dashed line at a value */
		references?: { label: string; value: number }[];
	}

	let {
		data,
		title = '',
		format,
		references = [],
	}: Props = $props();

	const formatValue = pickFormat(format);

	let hoveredBar = $state(-1);
	let hoveredSeg = $state(-1);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const margin = { top: 20, right: 20, bottom: 30, left: 10 };

	function getMaxTotal(): number {
		const totals = data.map((d) => d.segments.reduce((sum, s) => sum + s.value, 0));
		const refMax = references.length ? Math.max(...references.map((r) => r.value)) : 0;
		return Math.max(...totals, refMax);
	}

	function allSegmentLabels(): string[] {
		const seen = new Set<string>();
		const labels: string[] = [];
		for (const d of data) {
			for (const s of d.segments) {
				if (!seen.has(s.label)) {
					seen.add(s.label);
					labels.push(s.label);
				}
			}
		}
		return labels;
	}
</script>

<ChartContainer {title} aspectRatio={0.35} minHeight={data.length * 60 + 80}>
	{#snippet children({ width, height })}
		{@const maxVal = getMaxTotal()}
		{@const ticks = niceScale(0, maxVal)}
		{@const niceMax = ticks[ticks.length - 1]}
		{@const labelWidth = Math.min(width * 0.25, 140)}
		{@const barAreaWidth = width - labelWidth - margin.right}
		{@const barHeight = Math.min(44, (height - margin.top - margin.bottom) / data.length - 8)}
		{@const scaleX = linearScale(0, niceMax, 0, barAreaWidth)}
		{@const segLabels = allSegmentLabels()}
		<svg {width} {height} role="img" aria-label={title}>
			<!-- Grid -->
			{#each ticks as tick}
				<line
					x1={labelWidth + scaleX(tick)} y1={margin.top}
					x2={labelWidth + scaleX(tick)} y2={height - margin.bottom}
					stroke="rgb(var(--gray-light))" stroke-width="1"
				/>
				<text
					x={labelWidth + scaleX(tick)} y={height - margin.bottom + 16}
					text-anchor="middle" fill="rgb(var(--gray))" font-size="11"
				>{formatValue(tick)}</text>
			{/each}

			<!-- Stacked bars -->
			{#each data as row, ri}
				{@const y = margin.top + ri * ((height - margin.top - margin.bottom) / data.length)}
				{#each row.segments as seg, si}
					{@const offset = row.segments.slice(0, si).reduce((s, sg) => s + sg.value, 0)}
					{@const x = labelWidth + scaleX(offset)}
					{@const w = scaleX(seg.value)}
					{@const color = seg.color || CHART_COLORS[si % CHART_COLORS.length]}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<rect
						x={x} y={y + 2}
						width={w} height={barHeight - 4}
						fill={color} rx="2"
						opacity={hoveredBar === -1 || (hoveredBar === ri && hoveredSeg === si) ? 1 : 0.4}
						onmouseenter={() => { hoveredBar = ri; hoveredSeg = si; tooltipX = x + w / 2; tooltipY = y; }}
						onmouseleave={() => { hoveredBar = -1; hoveredSeg = -1; }}
						style="cursor: pointer"
					/>
					{#if w > 50}
						<text
							x={x + w / 2} y={y + barHeight / 2}
							text-anchor="middle" dominant-baseline="central"
							fill="white" font-size="11" font-weight="600"
							pointer-events="none"
						>{formatValue(seg.value)}</text>
					{/if}
				{/each}
				<text
					x={labelWidth - 8} y={y + barHeight / 2}
					text-anchor="end" dominant-baseline="central"
					fill="rgb(var(--gray-dark))" font-size={width < 500 ? '11' : '13'}
				>{row.label}</text>
			{/each}

			<!-- Reference lines -->
			{#each references as ref}
				{@const rx = labelWidth + scaleX(ref.value)}
				<line
					x1={rx} y1={margin.top} x2={rx} y2={height - margin.bottom}
					stroke="rgb(var(--gray))" stroke-width="2" stroke-dasharray="6,4"
				/>
				<text
					x={rx} y={margin.top - 6}
					text-anchor="middle" fill="rgb(var(--gray))" font-size="11"
				>{ref.label}</text>
			{/each}

			<!-- Legend -->
			<g transform="translate({labelWidth}, {height - 6})">
				{#each segLabels as label, i}
					{@const color = CHART_COLORS[i % CHART_COLORS.length]}
					<rect x={i * 140} y={-10} width="12" height="12" fill={color} rx="2" />
					<text x={i * 140 + 16} y={0} fill="rgb(var(--gray-dark))" font-size="11">{label}</text>
				{/each}
			</g>
		</svg>
		<Tooltip x={tooltipX} y={tooltipY} visible={hoveredBar !== -1}>
			{#if hoveredBar !== -1 && hoveredSeg !== -1}
				{@const seg = data[hoveredBar].segments[hoveredSeg]}
				<strong>{data[hoveredBar].label}</strong><br />
				{seg.label}: {formatValue(seg.value)}
			{/if}
		</Tooltip>
	{/snippet}
</ChartContainer>
