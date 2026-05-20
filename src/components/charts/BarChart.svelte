<script lang="ts">
	import ChartContainer from './core/ChartContainer.svelte';
	import Tooltip from './core/Tooltip.svelte';
	import { linearScale, CHART_COLORS, niceScale, pickFormat } from './core/utils.js';

	interface BarDatum {
		label: string;
		value: number;
		color?: string;
		group?: string;
	}

	interface Props {
		data: BarDatum[];
		title?: string;
		horizontal?: boolean;
		valueLabel?: string;
		format?: string;
		references?: { label: string; value: number }[];
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

	function getMinMax(): [number, number] {
		const vals = data.map((d) => d.value);
		if (references.length) vals.push(...references.map((r) => r.value));
		vals.push(0);
		return [Math.min(...vals), Math.max(...vals)];
	}

	function getLabels() {
		if (groups) {
			const seen = new Set<string>();
			return data.filter((d) => {
				if (seen.has(d.label)) return false;
				seen.add(d.label);
				return true;
			}).map((d) => d.label);
		}
		return data.map((d) => d.label);
	}

	// Store bar hit areas for mouse interaction
	interface HitArea { index: number; x: number; y: number; w: number; h: number; tx: number; ty: number; }
	let hitAreas: HitArea[] = [];

	function buildHorizontalSVG(width: number, height: number): string {
		const [minVal, maxVal] = getMinMax();
		const labels = getLabels();
		const ticks = niceScale(minVal, maxVal);
		const niceMin = ticks[0];
		const niceMax = ticks[ticks.length - 1];
		const groupKeys = groups ? groups.map((g) => g.key) : [undefined as unknown as string];
		const groupCount = groupKeys.length;
		const labelWidth = Math.min(width * 0.3, 160);
		const barAreaWidth = width - labelWidth - margin.right;
		const barHeight = Math.min(36, (height - margin.top - margin.bottom) / labels.length - 4);
		const scaleX = linearScale(niceMin, niceMax, 0, barAreaWidth);

		hitAreas = [];
		let svg = '';

		// Grid lines & tick labels
		for (const tick of ticks) {
			const tx = labelWidth + scaleX(tick);
			svg += `<line x1="${tx}" y1="${margin.top}" x2="${tx}" y2="${height - margin.bottom}" stroke="rgb(var(--gray-light))" stroke-width="1"/>`;
			svg += `<text x="${tx}" y="${height - margin.bottom + 16}" text-anchor="middle" fill="rgb(var(--gray))" font-size="11">${formatValue(tick)}</text>`;
		}

		// Bars
		labels.forEach((label, i) => {
			const y = margin.top + i * ((height - margin.top - margin.bottom) / labels.length);
			groupKeys.forEach((gk, gi) => {
				const datum = groups ? data.find((d) => d.label === label && d.group === gk) : data[i];
				if (!datum) return;
				const subBarHeight = barHeight / groupCount;
				const barY = y + gi * subBarHeight + 2;
				const barW = scaleX(datum.value);
				const color = groups ? groups[gi].color : datum.color || CHART_COLORS[i % CHART_COLORS.length];
				const hIdx = i * groupCount + gi;
				const opacity = hoveredIndex === -1 || hoveredIndex === hIdx ? 1 : 0.4;
				hitAreas.push({ index: hIdx, x: labelWidth, y: barY, w: barW, h: subBarHeight - 2, tx: labelWidth + barW, ty: barY });
				svg += `<rect x="${labelWidth + scaleX(Math.min(0, datum.value))}" y="${barY}" width="${Math.abs(scaleX(datum.value) - scaleX(0))}" height="${subBarHeight - 2}" fill="${color}" rx="2" opacity="${opacity}"/>`;
				if (barW > 60) {
					svg += `<text x="${labelWidth + barW - 6}" y="${barY + subBarHeight / 2}" text-anchor="end" dominant-baseline="central" fill="white" font-size="12" font-weight="600">${formatValue(datum.value)}</text>`;
				}
			});
			svg += `<text x="${labelWidth - 8}" y="${y + barHeight / 2 + 2}" text-anchor="end" dominant-baseline="central" fill="rgb(var(--gray-dark))" font-size="${width < 500 ? '11' : '13'}">${label}</text>`;
		});

		// Reference lines
		for (const ref of references) {
			const rx = labelWidth + scaleX(ref.value);
			svg += `<line x1="${rx}" y1="${margin.top}" x2="${rx}" y2="${height - margin.bottom}" stroke="rgb(var(--gray))" stroke-width="1.5" stroke-dasharray="5,4"/>`;
			svg += `<text x="${rx}" y="${margin.top - 4}" text-anchor="middle" fill="rgb(var(--gray))" font-size="11">${ref.label}</text>`;
		}

		if (valueLabel) {
			svg += `<text x="${labelWidth + barAreaWidth / 2}" y="${height - 4}" text-anchor="middle" fill="rgb(var(--gray))" font-size="11">${valueLabel}</text>`;
		}

		return svg;
	}

	function buildVerticalSVG(width: number, height: number): string {
		const [minVal, maxVal] = getMinMax();
		const labels = getLabels();
		const ticks = niceScale(minVal, maxVal);
		const niceMin = ticks[0];
		const niceMax = ticks[ticks.length - 1];
		const groupKeys = groups ? groups.map((g) => g.key) : [undefined as unknown as string];
		const groupCount = groupKeys.length;
		const chartLeft = margin.left + 50;
		const barAreaWidth = width - chartLeft - margin.right;
		const barWidth = Math.min(60, barAreaWidth / labels.length / groupCount - 4);
		const scaleY = linearScale(niceMin, niceMax, height - margin.bottom, margin.top);

		hitAreas = [];
		let svg = '';

		// Grid lines & tick labels
		for (const tick of ticks) {
			const ty = scaleY(tick);
			svg += `<line x1="${chartLeft}" y1="${ty}" x2="${width - margin.right}" y2="${ty}" stroke="rgb(var(--gray-light))" stroke-width="1"/>`;
			svg += `<text x="${chartLeft - 6}" y="${ty}" text-anchor="end" dominant-baseline="central" fill="rgb(var(--gray))" font-size="11">${formatValue(tick)}</text>`;
		}

		// Bars
		labels.forEach((label, i) => {
			const groupWidth = barWidth * groupCount + 4 * (groupCount - 1);
			const x = chartLeft + (i + 0.5) * (barAreaWidth / labels.length) - groupWidth / 2;
			groupKeys.forEach((gk, gi) => {
				const datum = groups ? data.find((d) => d.label === label && d.group === gk) : data[i];
				if (!datum) return;
				const barX = x + gi * (barWidth + 4);
				const barY = scaleY(datum.value);
				const barH = scaleY(0) - barY;
				const color = groups ? groups[gi].color : datum.color || CHART_COLORS[i % CHART_COLORS.length];
				const hIdx = i * groupCount + gi;
				const opacity = hoveredIndex === -1 || hoveredIndex === hIdx ? 1 : 0.4;
				hitAreas.push({ index: hIdx, x: barX, y: Math.min(scaleY(0), scaleY(datum.value)), w: barWidth, h: Math.abs(barH), tx: barX + barWidth / 2, ty: barY });
				svg += `<rect x="${barX}" y="${Math.min(scaleY(0), scaleY(datum.value))}" width="${barWidth}" height="${Math.abs(barH)}" fill="${color}" rx="2" opacity="${opacity}"/>`;
				svg += `<text x="${barX + barWidth / 2}" y="${barY - 6}" text-anchor="middle" fill="rgb(var(--gray-dark))" font-size="11" font-weight="600">${formatValue(datum.value)}</text>`;
			});
			svg += `<text x="${chartLeft + (i + 0.5) * (barAreaWidth / labels.length)}" y="${height - margin.bottom + 18}" text-anchor="middle" fill="rgb(var(--gray-dark))" font-size="${width < 500 ? '10' : '12'}">${label}</text>`;
		});

		// Reference lines
		for (const ref of references) {
			const ry = scaleY(ref.value);
			svg += `<line x1="${chartLeft}" y1="${ry}" x2="${width - margin.right}" y2="${ry}" stroke="rgb(var(--gray))" stroke-width="1.5" stroke-dasharray="5,4"/>`;
			svg += `<text x="${width - margin.right + 4}" y="${ry}" text-anchor="start" dominant-baseline="central" fill="rgb(var(--gray))" font-size="11">${ref.label}</text>`;
		}

		// Group legend
		if (groups) {
			groups.forEach((g, gi) => {
				svg += `<rect x="${chartLeft + gi * 120}" y="${height - 14}" width="12" height="12" fill="${g.color}" rx="2"/>`;
				svg += `<text x="${chartLeft + gi * 120 + 16}" y="${height - 4}" fill="rgb(var(--gray-dark))" font-size="11">${g.label}</text>`;
			});
		}

		return svg;
	}

	function handleSVGMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;
		let found = -1;
		for (const area of hitAreas) {
			if (mx >= area.x && mx <= area.x + area.w && my >= area.y && my <= area.y + area.h) {
				found = area.index;
				tooltipX = area.tx;
				tooltipY = area.ty;
				break;
			}
		}
		hoveredIndex = found;
	}
</script>

<ChartContainer {title} aspectRatio={horizontal ? 0.5 : 0.6} minHeight={data.length > 4 ? 300 : 200}>
	{#snippet children({ width, height })}
		<div style="position:relative;width:{width}px;height:{height}px">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<svg
				{width}
				{height}
				style="position:absolute;top:0;left:0"
				role="img"
				aria-label={title}
				onmousemove={handleSVGMouseMove}
				onmouseleave={() => (hoveredIndex = -1)}
			>
				{@html horizontal ? buildHorizontalSVG(width, height) : buildVerticalSVG(width, height)}
			</svg>

			<Tooltip x={tooltipX} y={tooltipY} visible={hoveredIndex !== -1}>
				{#if hoveredIndex !== -1}
					{@const datum = data[hoveredIndex] || data[0]}
					<strong>{datum.label}</strong>: {formatValue(datum.value)}
					{#if valueLabel} {valueLabel}{/if}
				{/if}
			</Tooltip>
		</div>
	{/snippet}
</ChartContainer>
