<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import Tooltip from './core/Tooltip.svelte';
	import geoData from '../../data/map-geo.json';

	type Extent = 'bengal' | 'bengal-wide' | 'subcontinent' | 'southeast-asia';
	type LatLon = [number, number]; // [lat, lon]

	interface PointFeature {
		type: 'point';
		lat: number;
		lon: number;
		label?: string;
		labelDir?: 'n' | 's' | 'e' | 'w';
		labelDx?: number; // pixel nudge, overrides labelDir x
		labelDy?: number; // pixel nudge, overrides labelDir y
		detail?: string;
		color?: string;
	}

	interface RegionFeature {
		type: 'region';
		name?: string;
		coords?: LatLon[];
		label?: string;
		labelOffset?: 'n' | 's' | 'e' | 'w';
		fill?: string;
		opacity?: number;
		dashed?: boolean;
	}

	interface RouteFeature {
		type: 'route';
		points: LatLon[];
		label?: string;
		dashed?: boolean;
		color?: string;
	}

	type MapFeature = PointFeature | RegionFeature | RouteFeature;

	interface LegendItem {
		color: string;
		label: string;
		shape: 'rect' | 'circle' | 'line';
		dashed?: boolean;
	}

	interface Props {
		extent?: Extent;
		features?: MapFeature[];
		title?: string;
		aspectRatio?: number;
		legend?: LegendItem[];
	}

	let { extent = 'subcontinent', features = [], title = '', aspectRatio = 0.65, legend }: Props = $props();

	const mapId = Math.random().toString(36).slice(2, 8);

	// [latMin, latMax, lonMin, lonMax]
	const EXTENTS: Record<Extent, [number, number, number, number]> = {
		bengal: [20, 28, 84, 96],
		'bengal-wide': [19, 28, 80, 96],
		subcontinent: [5, 37, 63, 98],
		'southeast-asia': [3, 37, 63, 112],
	};

	// Predefined named regions as approximate polygons [lat, lon][]
	// Shapes are stylised (not administrative boundaries) — convey geographic sense
	const REGIONS: Record<string, LatLon[]> = {
		// Chota Nagpur Plateau — irregular highland, higher/wider in north, narrows east and south
		'chota-nagpur': [
			[24.2, 83.5], [24.5, 84.5], [24.3, 85.5], [24.0, 86.5], [23.2, 87.0],
			[22.2, 86.8], [21.5, 86.0], [21.2, 85.0], [21.2, 83.5], [21.8, 82.5],
			[22.5, 82.0], [23.3, 82.2], [23.8, 83.0],
		],
		// Rāṛh — laterite belt, west Bengal between plateau edge and the delta
		rarh: [
			[22.0, 86.0], [23.5, 86.0], [24.0, 87.0], [23.5, 88.0],
			[22.5, 88.0], [21.8, 87.5], [21.5, 86.8],
		],
		// Santhal Parganas — NE Jharkhand escarpment
		'santhal-parganas': [
			[24.0, 86.5], [24.8, 86.8], [25.2, 87.5], [24.5, 87.8],
			[23.8, 87.5], [23.5, 87.0],
		],
		// Jharkhand state (approximate)
		jharkhand: [
			[24.5, 83.5], [25.0, 84.5], [24.8, 85.5], [25.2, 87.5],
			[24.3, 87.8], [23.5, 87.5], [22.5, 87.0], [21.5, 86.5],
			[21.2, 85.5], [21.2, 83.5], [21.8, 82.5], [22.5, 82.0], [23.5, 82.5],
		],
		// Anga — east Bihar / Bhagalpur region
		anga: [[24.5, 86.0], [26.0, 86.0], [26.0, 88.5], [24.5, 88.5]],
		// Vanga — Bengal delta (lower Bengal + Bangladesh)
		vanga: [
			[24.0, 88.0], [25.0, 88.5], [25.0, 91.0], [23.5, 92.0],
			[22.0, 91.5], [21.5, 90.0], [22.0, 88.5],
		],
		// Kalinga — coastal Odisha
		kalinga: [
			[21.5, 84.5], [22.0, 84.5], [22.0, 87.0], [20.5, 87.5],
			[19.0, 85.5], [18.0, 84.0], [18.5, 83.5], [20.0, 83.5],
		],
		// Magadha — south Bihar, Ganga plain
		magadha: [[24.5, 83.5], [26.5, 83.5], [26.5, 86.5], [24.5, 86.0]],
		// Odisha state
		odisha: [
			[22.0, 82.5], [22.0, 87.0], [20.5, 87.5], [19.0, 85.5],
			[18.0, 84.0], [17.5, 83.5], [18.0, 82.0], [19.5, 80.5], [21.0, 81.0],
		],
		// Bengal (cultural) — lower Bengal + Rarh + delta
		bengal: [
			[24.0, 87.5], [25.5, 88.0], [25.5, 89.5], [25.0, 91.0],
			[23.5, 92.0], [22.0, 91.5], [21.5, 90.0], [22.0, 88.0],
			[22.5, 87.0], [23.5, 87.5],
		],
		// Pala Empire extent (~8th–12th c) — Bengal + Bihar + Assam margins
		'pala-empire': [[22.0, 83.0], [27.5, 83.0], [27.5, 91.5], [22.0, 91.5]],
		// Sena Empire (12th c) — mostly Bengal
		'sena-empire': [[22.0, 87.5], [25.5, 87.5], [25.5, 91.5], [22.0, 91.5]],
		// Bargi/Maratha territory
		'bargi-territory': [
			[19.5, 73.0], [21.5, 73.0], [22.0, 75.0], [21.0, 79.0],
			[19.0, 79.5], [17.0, 78.5], [16.5, 76.0], [17.5, 74.0],
		],
		// Champa (Vietnam coast, central)
		'champa-vietnam': [[11.0, 107.5], [14.0, 108.0], [16.5, 108.5], [15.0, 110.0], [12.0, 109.5]],
		// Champasak (S Laos)
		champasak: [[14.0, 105.0], [15.5, 105.5], [15.8, 107.0], [14.5, 107.5], [13.5, 106.0]],
	};


	function project(
		lat: number,
		lon: number,
		bounds: [number, number, number, number],
		w: number,
		h: number,
	): [number, number] {
		const [latMin, latMax, lonMin, lonMax] = bounds;
		const x = ((lon - lonMin) / (lonMax - lonMin)) * w;
		const y = ((latMax - lat) / (latMax - latMin)) * h;
		return [x, y];
	}

	function regionCenter(coords: LatLon[]): LatLon {
		const lat = coords.reduce((s, [la]) => s + la, 0) / coords.length;
		const lon = coords.reduce((s, [, lo]) => s + lo, 0) / coords.length;
		return [lat, lon];
	}

	let hoveredIndex = $state(-1);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
</script>

<ChartContainer {title} {aspectRatio} minHeight={250}>
	{#snippet children({ width, height })}
		{@const bounds = EXTENTS[extent]}
		{@const proj = (lat: number, lon: number) => project(lat, lon, bounds, width, height)}
		{@const toPoints = (coords: LatLon[]) =>
			coords
				.map(([la, lo]) => proj(la, lo))
				.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
				.join(' ')}
		<div style="position:relative;width:{width}px;height:{height}px">
			<svg {width} {height} style="position:absolute;top:0;left:0" role="img" aria-label={title}>
				<defs>
					<marker
						id="arrow-{mapId}"
						markerWidth="8"
						markerHeight="6"
						refX="7"
						refY="3"
						orient="auto"
					>
						<polygon points="0,0 8,3 0,6" fill="#c0392b" opacity="0.85" />
					</marker>
				</defs>

				<!-- Ocean background -->
				<rect x="0" y="0" {width} {height} fill="#d4e9f7" />

				<!-- Land polygons from Natural Earth 50m -->
				{#each (geoData as any).land as ring}
					<polygon
						points={ring.map(([lon, lat]: [number,number]) => proj(lat, lon)).map(([x, y]: [number,number]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
						fill="#ede8d5"
						stroke="none"
					/>
				{/each}
				<!-- Coastline strokes for crispness -->
				{#each (geoData as any).coastlines as ring}
					<polyline
						points={ring.map(([lon, lat]: [number,number]) => proj(lat, lon)).map(([x, y]: [number,number]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
						fill="none"
						stroke="#a09080"
						stroke-width="0.7"
					/>
				{/each}

				<!-- Regions (rendered below points so points are on top) -->
				{#each features as feat, i}
					{#if feat.type === 'region'}
						{@const coords = feat.coords ?? (feat.name ? (REGIONS[feat.name] ?? []) : [])}
						{#if coords.length > 0}
							{@const [cLat, cLon] = regionCenter(coords)}
							{@const [cx, cy] = proj(cLat, cLon)}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<polygon
								points={toPoints(coords)}
								fill={feat.fill ?? '#e07c39'}
								opacity={feat.opacity ?? 0.35}
								stroke={feat.fill ?? '#e07c39'}
								stroke-width="1.5"
								stroke-dasharray={feat.dashed ? '5,3' : undefined}
								onmouseenter={() => {
									hoveredIndex = i;
									tooltipX = cx;
									tooltipY = cy;
								}}
								onmouseleave={() => (hoveredIndex = -1)}
								style="cursor:default"
							/>
							{#if feat.label}
								{@const ldy = feat.labelOffset === 'n' ? -16 : feat.labelOffset === 's' ? 16 : 0}
								{@const ldx = feat.labelOffset === 'w' ? -16 : feat.labelOffset === 'e' ? 16 : 0}
								<text
									x={cx + ldx}
									y={cy + ldy}
									text-anchor="middle"
									dominant-baseline="central"
									font-size="10"
									fill="#3a3020"
									font-weight="600"
									stroke="#ede8d5"
									stroke-width="3"
									paint-order="stroke"
									pointer-events="none"
								>{feat.label}</text>
							{/if}
						{/if}
					{/if}
				{/each}

				<!-- Routes -->
				{#each features as feat}
					{#if feat.type === 'route'}
						{#each feat.points.slice(0, -1) as pt, j}
							{@const [x1, y1] = proj(pt[0], pt[1])}
							{@const [x2, y2] = proj(feat.points[j + 1][0], feat.points[j + 1][1])}
							<line
								{x1}
								{y1}
								{x2}
								{y2}
								stroke={feat.color ?? '#c0392b'}
								stroke-width="2"
								stroke-dasharray={feat.dashed ? '6,4' : undefined}
								marker-end="url(#arrow-{mapId})"
								opacity="0.85"
							/>
						{/each}
					{/if}
				{/each}

				<!-- Points -->
				{#each features as feat, i}
					{#if feat.type === 'point'}
						{@const [cx, cy] = proj(feat.lat, feat.lon)}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<g
							onmouseenter={() => {
								hoveredIndex = i;
								tooltipX = cx;
								tooltipY = cy;
							}}
							onmouseleave={() => (hoveredIndex = -1)}
							style="cursor:pointer"
						>
							<circle
								cx={cx}
								cy={cy}
								r={hoveredIndex === i ? 7 : 5}
								fill={feat.color ?? '#c0392b'}
								stroke="white"
								stroke-width="1.5"
							/>
							{#if feat.label}
								{@const dx = feat.labelDx ?? (feat.labelDir === 'w' ? -9 : feat.labelDir === 'e' ? 9 : 0)}
								{@const dy = feat.labelDy ?? (feat.labelDir === 'n' ? -10 : feat.labelDir === 's' ? 16 : 4)}
								{@const anchor = feat.labelDx != null ? (feat.labelDx < 0 ? 'end' : 'start') : (feat.labelDir === 'w' ? 'end' : feat.labelDir === 'e' ? 'start' : 'middle')}
								<text
									x={cx + dx}
									y={cy + dy}
									text-anchor={anchor}
									font-size="10"
									fill="#3a3020"
									stroke="#ede8d5"
									stroke-width="3"
									paint-order="stroke"
									pointer-events="none"
								>{feat.label}</text>
							{/if}
						</g>
					{/if}
				{/each}
				<!-- Legend -->
				{#if legend && legend.length > 0}
					{@const lx = 10}
					{@const ly = height - 12 - legend.length * 18}
					<rect x={lx - 4} y={ly - 8} width="140" height={legend.length * 18 + 10}
						fill="white" opacity="0.75" rx="3" />
					{#each legend as item, li}
						{@const iy = ly + li * 18}
						{#if item.shape === 'rect'}
							<rect x={lx} y={iy - 6} width="14" height="10" fill={item.color} opacity="0.7"
								stroke={item.color} stroke-width="1"
								stroke-dasharray={item.dashed ? '4,2' : undefined} />
						{:else if item.shape === 'circle'}
							<circle cx={lx + 7} cy={iy - 1} r="5" fill={item.color} stroke="white" stroke-width="1.5" />
						{:else if item.shape === 'line'}
							<line x1={lx} y1={iy - 1} x2={lx + 14} y2={iy - 1}
								stroke={item.color} stroke-width="2"
								stroke-dasharray={item.dashed ? '5,3' : undefined} />
							<polygon points="{lx+10},{iy - 4} {lx+14},{iy - 1} {lx+10},{iy + 2}"
								fill={item.color} />
						{/if}
						<text x={lx + 20} y={iy + 3} font-size="10" fill="#3a3020">{item.label}</text>
					{/each}
				{/if}
			</svg>

			<Tooltip x={tooltipX} y={tooltipY} visible={hoveredIndex !== -1}>
				{#if hoveredIndex !== -1}
					{@const feat = features[hoveredIndex]}
					{#if feat.type === 'point'}
						<strong>{feat.label ?? ''}</strong>
						{#if feat.detail}<br />{feat.detail}{/if}
					{:else if feat.type === 'region'}
						<strong>{feat.label ?? feat.name ?? ''}</strong>
					{/if}
				{/if}
			</Tooltip>
		</div>
	{/snippet}
</ChartContainer>
