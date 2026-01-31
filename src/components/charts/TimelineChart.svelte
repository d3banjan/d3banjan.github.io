<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import Tooltip from './core/Tooltip.svelte';
	import { CHART_COLORS } from './core/utils.js';

	interface TimelineEvent {
		label: string;
		start: number;
		end?: number;
		type: 'milestone' | 'period' | 'critical';
		detail?: string;
		row?: number;
	}

	interface Props {
		events: TimelineEvent[];
		title?: string;
		minYear?: number;
		maxYear?: number;
	}

	let {
		events,
		title = '',
		minYear,
		maxYear,
	}: Props = $props();

	let hoveredIndex = $state(-1);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const margin = { top: 30, right: 20, bottom: 30, left: 20 };
	const rowHeight = 40;

	function computeMinMax(): [number, number] {
		const starts = events.map((e) => e.start);
		const ends = events.map((e) => e.end ?? e.start);
		return [
			minYear ?? Math.min(...starts) - 0.5,
			maxYear ?? Math.max(...ends) + 0.5,
		];
	}

	function assignRows(): number[] {
		// Assign rows, respecting explicit row assignments and avoiding overlap
		const rows: number[] = new Array(events.length).fill(0);
		const occupied: { end: number; row: number }[] = [];
		for (let i = 0; i < events.length; i++) {
			if (events[i].row !== undefined) {
				rows[i] = events[i].row!;
				occupied.push({ end: events[i].end ?? events[i].start + 0.3, row: rows[i] });
				continue;
			}
			let r = 0;
			while (occupied.some((o) => o.row === r && o.end > events[i].start - 0.1)) r++;
			rows[i] = r;
			occupied.push({ end: events[i].end ?? events[i].start + 0.3, row: r });
		}
		return rows;
	}
</script>

<ChartContainer {title} aspectRatio={0.3} minHeight={180}>
	{#snippet children({ width, height })}
		{@const [yearMin, yearMax] = computeMinMax()}
		{@const rows = assignRows()}
		{@const maxRow = Math.max(...rows)}
		{@const chartWidth = width - margin.left - margin.right}
		{@const yearSpan = yearMax - yearMin || 1}
		{@const xScale = (year: number) => margin.left + ((year - yearMin) / yearSpan) * chartWidth}
		{@const years = Array.from({ length: Math.ceil(yearMax) - Math.floor(yearMin) + 1 }, (_, i) => Math.floor(yearMin) + i)}
		<div class="timeline-scroll">
			<svg width={Math.max(width, events.length * 80)} {height} role="img" aria-label={title}>
				<!-- Year grid -->
				{#each years as year}
					<line
						x1={xScale(year)} y1={margin.top}
						x2={xScale(year)} y2={height - margin.bottom}
						stroke="rgb(var(--gray-light))" stroke-width="1"
					/>
					<text
						x={xScale(year)} y={height - margin.bottom + 16}
						text-anchor="middle" fill="rgb(var(--gray))" font-size="12"
					>{year}</text>
				{/each}

				<!-- Timeline axis -->
				<line
					x1={margin.left} y1={margin.top + (maxRow + 1) * rowHeight / 2}
					x2={width - margin.right} y2={margin.top + (maxRow + 1) * rowHeight / 2}
					stroke="rgb(var(--gray-light))" stroke-width="2"
				/>

				<!-- Events -->
				{#each events as evt, i}
					{@const row = rows[i]}
					{@const y = margin.top + row * rowHeight + 4}
					{@const color = evt.type === 'critical' ? '#e05555' : CHART_COLORS[i % CHART_COLORS.length]}
					{#if evt.end && evt.end !== evt.start}
						<!-- Period bar -->
						{@const x1 = xScale(evt.start)}
						{@const x2 = xScale(evt.end)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<g
							onmouseenter={() => { hoveredIndex = i; tooltipX = (x1 + x2) / 2; tooltipY = y; }}
							onmouseleave={() => { hoveredIndex = -1; }}
							style="cursor: pointer"
						>
							<rect
								x={x1} y={y}
								width={x2 - x1} height={rowHeight - 12}
								fill={color} rx="4"
								opacity={hoveredIndex === -1 || hoveredIndex === i ? 0.85 : 0.3}
							/>
							{#if x2 - x1 > 60}
								<text
									x={(x1 + x2) / 2} y={y + (rowHeight - 12) / 2}
									text-anchor="middle" dominant-baseline="central"
									fill="white" font-size="11" font-weight="600"
									pointer-events="none"
								>{evt.label}</text>
							{/if}
						</g>
					{:else}
						<!-- Milestone -->
						{@const cx = xScale(evt.start)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<g
							onmouseenter={() => { hoveredIndex = i; tooltipX = cx; tooltipY = y; }}
							onmouseleave={() => { hoveredIndex = -1; }}
							style="cursor: pointer"
						>
							<circle
								cx={cx} cy={y + (rowHeight - 12) / 2}
								r={hoveredIndex === i ? 8 : 6}
								fill={color}
								stroke="rgb(var(--gray-light))" stroke-width="2"
							/>
							<text
								x={cx} y={y - 4}
								text-anchor="middle"
								fill="rgb(var(--gray-dark))" font-size="10"
							>{evt.label}</text>
						</g>
					{/if}
				{/each}
			</svg>
		</div>
		<Tooltip x={tooltipX} y={tooltipY} visible={hoveredIndex !== -1}>
			{#if hoveredIndex !== -1}
				{@const evt = events[hoveredIndex]}
				<strong>{evt.label}</strong><br />
				{evt.start}{evt.end ? ` \u2013 ${evt.end}` : ''}
				{#if evt.detail}<br />{evt.detail}{/if}
			{/if}
		</Tooltip>
	{/snippet}
</ChartContainer>

<style>
	.timeline-scroll {
		overflow-x: auto;
		width: 100%;
		-webkit-overflow-scrolling: touch;
	}
</style>
