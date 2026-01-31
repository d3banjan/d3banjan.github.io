<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import Tooltip from './core/Tooltip.svelte';
	import { linearScale, niceScale, CHART_COLORS, pickFormat } from './core/utils.js';

	interface DataPoint {
		x: number | string;
		y: number;
	}

	interface Series {
		label: string;
		data: DataPoint[];
		color?: string;
	}

	interface Props {
		series: Series[];
		title?: string;
		xLabel?: string;
		yLabel?: string;
		areaFill?: boolean;
		formatYKey?: string;
		/** Dashed reference lines: { label, value } */
		references?: { label: string; value: number; color?: string }[];
	}

	let {
		series,
		title = '',
		xLabel = '',
		yLabel = '',
		areaFill = false,
		formatYKey,
		references = [],
	}: Props = $props();

	const formatY = pickFormat(formatYKey);
	const formatX = (v: number | string) => String(v);

	let hoveredPointIndex = $state(-1);
	let hoveredSeriesIndex = $state(-1);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const margin = { top: 20, right: 30, bottom: 50, left: 60 };

	function getAllYValues(): number[] {
		const vals = series.flatMap((s) => s.data.map((d) => d.y));
		if (references.length) vals.push(...references.map((r) => r.value));
		return vals;
	}

	function getXLabels(): (number | string)[] {
		// Use the first series' x values as the canonical labels
		return series[0]?.data.map((d) => d.x) ?? [];
	}
</script>

<ChartContainer {title} aspectRatio={0.45} minHeight={250}>
	{#snippet children({ width, height })}
		{@const allY = getAllYValues()}
		{@const yMin = Math.min(0, ...allY)}
		{@const yMax = Math.max(...allY)}
		{@const yTicks = niceScale(yMin, yMax)}
		{@const niceYMax = yTicks[yTicks.length - 1]}
		{@const niceYMin = yTicks[0]}
		{@const xLabels = getXLabels()}
		{@const chartWidth = width - margin.left - margin.right}
		{@const chartHeight = height - margin.top - margin.bottom}
		{@const scaleY = linearScale(niceYMin, niceYMax, chartHeight, 0)}
		<svg {width} {height} role="img" aria-label={title}>
			<g transform="translate({margin.left}, {margin.top})">
				<!-- Y grid lines -->
				{#each yTicks as tick}
					<line
						x1={0} y1={scaleY(tick)}
						x2={chartWidth} y2={scaleY(tick)}
						stroke="rgb(var(--gray-light))"
						stroke-width="1"
					/>
					<text
						x={-8} y={scaleY(tick)}
						text-anchor="end"
						dominant-baseline="central"
						fill="rgb(var(--gray))"
						font-size="11"
					>{formatY(tick)}</text>
				{/each}

				<!-- X labels -->
				{#each xLabels as label, i}
					{@const x = xLabels.length === 1 ? chartWidth / 2 : (i / (xLabels.length - 1)) * chartWidth}
					<text
						x={x}
						y={chartHeight + 20}
						text-anchor="middle"
						fill="rgb(var(--gray))"
						font-size="11"
					>{formatX(label)}</text>
				{/each}

				<!-- Reference lines -->
				{#each references as ref}
					{@const ry = scaleY(ref.value)}
					<line
						x1={0} y1={ry} x2={chartWidth} y2={ry}
						stroke={ref.color || 'rgb(var(--gray))'}
						stroke-width="1.5"
						stroke-dasharray="6,4"
					/>
					<text
						x={chartWidth + 4} y={ry}
						text-anchor="start"
						dominant-baseline="central"
						fill={ref.color || 'rgb(var(--gray))'}
						font-size="10"
					>{ref.label}</text>
				{/each}

				<!-- Series -->
				{#each series as s, si}
					{@const color = s.color || CHART_COLORS[si % CHART_COLORS.length]}
					{@const points = s.data.map((d, i) => {
						const x = xLabels.length === 1 ? chartWidth / 2 : (i / (xLabels.length - 1)) * chartWidth;
						return { x, y: scaleY(d.y), raw: d };
					})}
					{@const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}

					<!-- Area fill -->
					{#if areaFill}
						{@const areaPath = linePath + ` L${points[points.length - 1].x},${scaleY(niceYMin)} L${points[0].x},${scaleY(niceYMin)} Z`}
						<path d={areaPath} fill={color} opacity="0.12" />
					{/if}

					<!-- Line -->
					<path d={linePath} fill="none" stroke={color} stroke-width="2.5" stroke-linejoin="round" />

					<!-- Data points -->
					{#each points as pt, pi}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<circle
							cx={pt.x} cy={pt.y} r={hoveredSeriesIndex === si && hoveredPointIndex === pi ? 6 : 4}
							fill={color}
							stroke="rgb(var(--gray-light))"
							stroke-width="2"
							onmouseenter={() => { hoveredSeriesIndex = si; hoveredPointIndex = pi; tooltipX = margin.left + pt.x; tooltipY = margin.top + pt.y; }}
							onmouseleave={() => { hoveredSeriesIndex = -1; hoveredPointIndex = -1; }}
							style="cursor: pointer"
						/>
					{/each}
				{/each}

				<!-- Axis labels -->
				{#if xLabel}
					<text
						x={chartWidth / 2} y={chartHeight + 40}
						text-anchor="middle"
						fill="rgb(var(--gray))"
						font-size="12"
					>{xLabel}</text>
				{/if}
				{#if yLabel}
					<text
						x={-chartHeight / 2} y={-45}
						text-anchor="middle"
						fill="rgb(var(--gray))"
						font-size="12"
						transform="rotate(-90)"
					>{yLabel}</text>
				{/if}
			</g>

			<!-- Legend -->
			{#if series.length > 1}
				<g transform="translate({margin.left}, {height - 8})">
					{#each series as s, si}
						{@const color = s.color || CHART_COLORS[si % CHART_COLORS.length]}
						<g transform="translate({si * 130}, 0)">
							<line x1={0} y1={-4} x2={16} y2={-4} stroke={color} stroke-width="2.5" />
							<circle cx={8} cy={-4} r={3} fill={color} />
							<text x={20} y={0} fill="rgb(var(--gray-dark))" font-size="11">{s.label}</text>
						</g>
					{/each}
				</g>
			{/if}
		</svg>
		<Tooltip x={tooltipX} y={tooltipY} visible={hoveredPointIndex !== -1}>
			{#if hoveredSeriesIndex !== -1 && hoveredPointIndex !== -1}
				{@const s = series[hoveredSeriesIndex]}
				{@const d = s.data[hoveredPointIndex]}
				<strong>{s.label}</strong><br />
				{formatX(d.x)}: {formatY(d.y)}
			{/if}
		</Tooltip>
	{/snippet}
</ChartContainer>
