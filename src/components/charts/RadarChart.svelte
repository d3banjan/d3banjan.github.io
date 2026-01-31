<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import { CHART_COLORS } from './core/utils.js';

	interface RadarAxis {
		key: string;
		label: string;
		/** Max value for this axis (for normalization) */
		max: number;
	}

	interface RadarEntity {
		label: string;
		values: Record<string, number>;
		color?: string;
	}

	interface Props {
		axes: RadarAxis[];
		entities: RadarEntity[];
		title?: string;
	}

	let {
		axes,
		entities,
		title = '',
	}: Props = $props();

	let hoveredEntity = $state(-1);

	const rings = [0.25, 0.5, 0.75, 1.0];

	function polarToCartesian(cx: number, cy: number, r: number, angleIndex: number, total: number): [number, number] {
		const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
		return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
	}

	function polygonPath(cx: number, cy: number, radius: number, values: number[], maxValues: number[]): string {
		return values
			.map((v, i) => {
				const norm = v / (maxValues[i] || 1);
				const [x, y] = polarToCartesian(cx, cy, radius * norm, i, values.length);
				return `${i === 0 ? 'M' : 'L'}${x},${y}`;
			})
			.join(' ') + ' Z';
	}

	function ringPath(cx: number, cy: number, radius: number, sides: number): string {
		return Array.from({ length: sides }, (_, i) => {
			const [x, y] = polarToCartesian(cx, cy, radius, i, sides);
			return `${i === 0 ? 'M' : 'L'}${x},${y}`;
		}).join(' ') + ' Z';
	}
</script>

<ChartContainer {title} aspectRatio={0.85} minHeight={320}>
	{#snippet children({ width, height })}
		{@const cx = width / 2}
		{@const cy = height / 2 - 10}
		{@const radius = Math.min(cx - 60, cy - 40)}
		{@const n = axes.length}
		{@const maxValues = axes.map((a) => a.max)}
		<svg {width} {height} role="img" aria-label={title}>
			<!-- Ring backgrounds -->
			{#each rings as ring}
				<path
					d={ringPath(cx, cy, radius * ring, n)}
					fill="none"
					stroke="rgb(var(--gray-light))"
					stroke-width="1"
				/>
			{/each}

			<!-- Axis lines + labels -->
			{#each axes as axis, i}
				{@const [ex, ey] = polarToCartesian(cx, cy, radius, i, n)}
				{@const [lx, ly] = polarToCartesian(cx, cy, radius + 18, i, n)}
				<line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgb(var(--gray-light))" stroke-width="1" />
				<text
					x={lx} y={ly}
					text-anchor={lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle'}
					dominant-baseline={ly < cy - 5 ? 'auto' : ly > cy + 5 ? 'hanging' : 'central'}
					fill="rgb(var(--gray-dark))"
					font-size={width < 500 ? '10' : '12'}
				>{axis.label}</text>
			{/each}

			<!-- Entity polygons -->
			{#each entities as entity, ei}
				{@const color = entity.color || CHART_COLORS[ei % CHART_COLORS.length]}
				{@const values = axes.map((a) => entity.values[a.key] ?? 0)}
				{@const path = polygonPath(cx, cy, radius, values, maxValues)}
				{@const isHovered = hoveredEntity === ei}
				{@const dimmed = hoveredEntity !== -1 && !isHovered}
				<path
					d={path}
					fill={color}
					fill-opacity={dimmed ? 0.04 : 0.15}
					stroke={color}
					stroke-width={isHovered ? 3 : 1.5}
					opacity={dimmed ? 0.3 : 1}
				/>
				<!-- Data points -->
				{#each values as v, vi}
					{@const norm = v / (maxValues[vi] || 1)}
					{@const [px, py] = polarToCartesian(cx, cy, radius * norm, vi, n)}
					<circle
						cx={px} cy={py} r={isHovered ? 5 : 3}
						fill={color}
						opacity={dimmed ? 0.3 : 1}
					/>
				{/each}
			{/each}

			<!-- Legend (interactive) -->
			{#each entities as entity, ei}
				{@const color = entity.color || CHART_COLORS[ei % CHART_COLORS.length]}
				{@const lx = 12 + (ei % 3) * Math.min(180, width / 3)}
				{@const ly = height - 24 + Math.floor(ei / 3) * 18}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<g
					onmouseenter={() => hoveredEntity = ei}
					onmouseleave={() => hoveredEntity = -1}
					style="cursor: pointer"
				>
					<rect x={lx} y={ly - 10} width="12" height="12" fill={color} rx="2" />
					<text
						x={lx + 16} y={ly}
						fill="rgb(var(--gray-dark))"
						font-size="11"
						font-weight={hoveredEntity === ei ? '700' : '400'}
					>{entity.label}</text>
				</g>
			{/each}
		</svg>
	{/snippet}
</ChartContainer>
