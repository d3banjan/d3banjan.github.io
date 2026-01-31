<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import Tooltip from './core/Tooltip.svelte';
	import { linearScale, CHART_COLORS, niceScale, pickFormat } from './core/utils.js';

	interface BarDatum {
		label: string;
		value: number;
		color?: string;
		/** Optional group key for grouped bars */
		group?: string;
	}

	interface Props {
		data: BarDatum[];
		title?: string;
		horizontal?: boolean;
		valueLabel?: string;
		format?: string;
		/** Dashed reference lines: { label, value } */
		references?: { label: string; value: number }[];
		/** For grouped mode: group labels & colors */
		groups?: { key: string; label: string; color: string }[];
	}

	let {
		data,
		title = '',
		horizontal = false,
		valueLabel = '',
		format,
		references = [],
		groups,
	}: Props = $props();

	const formatValue = pickFormat(format);

	let hoveredIndex = $state(-1);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const margin = { top: 20, right: 20, bottom: 40, left: 10 };

	function getMaxValue() {
		const vals = data.map((d) => d.value);
		if (references.length) vals.push(...references.map((r) => r.value));
		return Math.max(...vals);
	}

	function getLabels() {
		if (groups) {
			// Unique labels in order
			const seen = new Set<string>();
			return data.filter((d) => {
				if (seen.has(d.label)) return false;
				seen.add(d.label);
				return true;
			}).map((d) => d.label);
		}
		return data.map((d) => d.label);
	}
</script>

<ChartContainer {title} aspectRatio={horizontal ? 0.5 : 0.6} minHeight={data.length > 4 ? 300 : 200}>
	{#snippet children({ width, height })}
		{@const maxVal = getMaxValue()}
		{@const labels = getLabels()}
		{@const ticks = niceScale(0, maxVal)}
		{@const niceMax = ticks[ticks.length - 1]}
		{@const groupKeys = groups ? groups.map((g) => g.key) : [undefined]}
		{@const groupCount = groupKeys.length}
		{#if horizontal}
			{@const labelWidth = Math.min(width * 0.3, 160)}
			{@const barAreaWidth = width - labelWidth - margin.right}
			{@const barHeight = Math.min(36, (height - margin.top - margin.bottom) / labels.length - 4)}
			{@const scaleX = linearScale(0, niceMax, 0, barAreaWidth)}
			<svg {width} {height} role="img" aria-label={title}>
				<!-- Grid lines -->
				{#each ticks as tick}
					<line
						x1={labelWidth + scaleX(tick)}
						y1={margin.top}
						x2={labelWidth + scaleX(tick)}
						y2={height - margin.bottom}
						stroke="rgb(var(--gray-light))"
						stroke-width="1"
					/>
					<text
						x={labelWidth + scaleX(tick)}
						y={height - margin.bottom + 16}
						text-anchor="middle"
						fill="rgb(var(--gray))"
						font-size="11"
					>{formatValue(tick)}</text>
				{/each}
				<!-- Bars -->
				{#each labels as label, i}
					{@const y = margin.top + i * ((height - margin.top - margin.bottom) / labels.length)}
					{#each groupKeys as gk, gi}
						{@const datum = groups
							? data.find((d) => d.label === label && d.group === gk)
							: data[i]}
						{#if datum}
							{@const subBarHeight = barHeight / groupCount}
							{@const barY = y + gi * subBarHeight + 2}
							{@const barW = scaleX(datum.value)}
							{@const color = groups ? groups[gi].color : datum.color || CHART_COLORS[i % CHART_COLORS.length]}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<g
								onmouseenter={(e) => { hoveredIndex = i * groupCount + gi; tooltipX = labelWidth + barW; tooltipY = barY; }}
								onmouseleave={() => { hoveredIndex = -1; }}
							>
								<rect
									x={labelWidth}
									y={barY}
									width={barW}
									height={subBarHeight - 2}
									fill={color}
									rx="2"
									opacity={hoveredIndex === -1 || hoveredIndex === i * groupCount + gi ? 1 : 0.4}
								/>
								{#if barW > 60}
									<text
										x={labelWidth + barW - 6}
										y={barY + subBarHeight / 2}
										text-anchor="end"
										dominant-baseline="central"
										fill="white"
										font-size="12"
										font-weight="600"
									>{formatValue(datum.value)}</text>
								{/if}
							</g>
						{/if}
					{/each}
					<text
						x={labelWidth - 8}
						y={y + barHeight / 2 + 2}
						text-anchor="end"
						dominant-baseline="central"
						fill="rgb(var(--gray-dark))"
						font-size={width < 500 ? '11' : '13'}
					>{label}</text>
				{/each}
				<!-- Reference lines -->
				{#each references as ref}
					{@const rx = labelWidth + scaleX(ref.value)}
					<line
						x1={rx} y1={margin.top} x2={rx} y2={height - margin.bottom}
						stroke="rgb(var(--gray))"
						stroke-width="1.5"
						stroke-dasharray="5,4"
					/>
					<text
						x={rx} y={margin.top - 4}
						text-anchor="middle"
						fill="rgb(var(--gray))"
						font-size="11"
					>{ref.label}</text>
				{/each}
				{#if valueLabel}
					<text
						x={labelWidth + barAreaWidth / 2}
						y={height - 4}
						text-anchor="middle"
						fill="rgb(var(--gray))"
						font-size="11"
					>{valueLabel}</text>
				{/if}
			</svg>
		{:else}
			<!-- Vertical bars -->
			{@const chartLeft = margin.left + 50}
			{@const barAreaWidth = width - chartLeft - margin.right}
			{@const barWidth = Math.min(60, barAreaWidth / labels.length / groupCount - 4)}
			{@const scaleY = linearScale(0, niceMax, height - margin.bottom, margin.top)}
			<svg {width} {height} role="img" aria-label={title}>
				<!-- Grid lines -->
				{#each ticks as tick}
					<line
						x1={chartLeft}
						y1={scaleY(tick)}
						x2={width - margin.right}
						y2={scaleY(tick)}
						stroke="rgb(var(--gray-light))"
						stroke-width="1"
					/>
					<text
						x={chartLeft - 6}
						y={scaleY(tick)}
						text-anchor="end"
						dominant-baseline="central"
						fill="rgb(var(--gray))"
						font-size="11"
					>{formatValue(tick)}</text>
				{/each}
				<!-- Bars -->
				{#each labels as label, i}
					{@const groupWidth = barWidth * groupCount + 4 * (groupCount - 1)}
					{@const x = chartLeft + (i + 0.5) * (barAreaWidth / labels.length) - groupWidth / 2}
					{#each groupKeys as gk, gi}
						{@const datum = groups
							? data.find((d) => d.label === label && d.group === gk)
							: data[i]}
						{#if datum}
							{@const barX = x + gi * (barWidth + 4)}
							{@const barY = scaleY(datum.value)}
							{@const barH = scaleY(0) - barY}
							{@const color = groups ? groups[gi].color : datum.color || CHART_COLORS[i % CHART_COLORS.length]}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<g
								onmouseenter={() => { hoveredIndex = i * groupCount + gi; tooltipX = barX + barWidth / 2; tooltipY = barY; }}
								onmouseleave={() => { hoveredIndex = -1; }}
							>
								<rect
									x={barX}
									y={barY}
									width={barWidth}
									height={barH}
									fill={color}
									rx="2"
									opacity={hoveredIndex === -1 || hoveredIndex === i * groupCount + gi ? 1 : 0.4}
								/>
								<text
									x={barX + barWidth / 2}
									y={barY - 6}
									text-anchor="middle"
									fill="rgb(var(--gray-dark))"
									font-size="11"
									font-weight="600"
								>{formatValue(datum.value)}</text>
							</g>
						{/if}
					{/each}
					<text
						x={chartLeft + (i + 0.5) * (barAreaWidth / labels.length)}
						y={height - margin.bottom + 18}
						text-anchor="middle"
						fill="rgb(var(--gray-dark))"
						font-size={width < 500 ? '10' : '12'}
					>{label}</text>
				{/each}
				<!-- Reference lines -->
				{#each references as ref}
					{@const ry = scaleY(ref.value)}
					<line
						x1={chartLeft} y1={ry} x2={width - margin.right} y2={ry}
						stroke="rgb(var(--gray))"
						stroke-width="1.5"
						stroke-dasharray="5,4"
					/>
					<text
						x={width - margin.right + 4} y={ry}
						text-anchor="start"
						dominant-baseline="central"
						fill="rgb(var(--gray))"
						font-size="11"
					>{ref.label}</text>
				{/each}
				<!-- Group legend -->
				{#if groups}
					<g transform="translate({chartLeft}, {height - 4})">
						{#each groups as g, gi}
							<rect x={gi * 120} y={-10} width="12" height="12" fill={g.color} rx="2" />
							<text x={gi * 120 + 16} y={0} fill="rgb(var(--gray-dark))" font-size="11">{g.label}</text>
						{/each}
					</g>
				{/if}
			</svg>
		{/if}
		<Tooltip x={tooltipX} y={tooltipY} visible={hoveredIndex !== -1}>
			{#if hoveredIndex !== -1}
				{@const datum = data[hoveredIndex] || data[0]}
				<strong>{datum.label}</strong>: {formatValue(datum.value)}
				{#if valueLabel} {valueLabel}{/if}
			{/if}
		</Tooltip>
	{/snippet}
</ChartContainer>
