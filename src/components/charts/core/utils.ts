/** Map a value from [domainMin, domainMax] to [rangeMin, rangeMax] */
export function linearScale(
	domainMin: number,
	domainMax: number,
	rangeMin: number,
	rangeMax: number,
) {
	const domainSpan = domainMax - domainMin || 1;
	const rangeSpan = rangeMax - rangeMin;
	return (value: number) => rangeMin + ((value - domainMin) / domainSpan) * rangeSpan;
}

/** Format a number as euros, e.g. 1500 → "€1,500" */
export function formatEuro(value: number): string {
	return `\u20AC${value.toLocaleString('en-US')}`;
}

/** Format a large number with suffix, e.g. 3000000 → "€3.0B" */
export function formatEuroCompact(value: number): string {
	if (Math.abs(value) >= 1e9) return `\u20AC${(value / 1e9).toFixed(1)}B`;
	if (Math.abs(value) >= 1e6) return `\u20AC${(value / 1e6).toFixed(1)}M`;
	if (Math.abs(value) >= 1e3) return `\u20AC${(value / 1e3).toFixed(0)}K`;
	return formatEuro(value);
}

/** Format a plain number with compact suffix, e.g. 331000 → "331K" */
export function formatCompact(value: number): string {
	if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
	if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
	if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
	return value.toLocaleString('en-US');
}

/**
 * Named format registry — serializable across Astro island boundaries.
 * Components accept a `format` string prop instead of a function.
 */
const FORMATTERS: Record<string, (v: number) => string> = {
	number: (v) => v.toLocaleString('en-US'),
	euro: (v) => `\u20AC${v.toLocaleString('en-US')}`,
	euroK: (v) => `\u20AC${Math.round(v / 1000)}K`,
	euroM: (v) => `\u20AC${v}M`,
	euroMVal: (v) => `\u20AC${Math.round(v)}M`,
	euroB: (v) => `\u20AC${v.toFixed(1)}B`,
	dollarM: (v) => `$${v}M`,
	percent: (v) => `${v}%`,
	K: (v) => `${v}K`,
	plain: (v) => String(v),
};

export function pickFormat(name?: string): (v: number) => string {
	return FORMATTERS[name || 'number'] || FORMATTERS.number;
}

/** Multi-series colors — WCAG AA against both #ffffff and #0f1219 */
export const CHART_COLORS = ['#e07c39', '#2da87e', '#c44dbb', '#d4a843', '#5b8def'] as const;

/** Generate evenly spaced tick values between min and max */
export function niceScale(min: number, max: number, ticks: number = 5): number[] {
	const range = max - min || 1;
	const roughStep = range / (ticks - 1);
	const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
	const residual = roughStep / magnitude;
	let niceStep: number;
	if (residual <= 1.5) niceStep = 1 * magnitude;
	else if (residual <= 3) niceStep = 2 * magnitude;
	else if (residual <= 7) niceStep = 5 * magnitude;
	else niceStep = 10 * magnitude;

	const niceMin = Math.floor(min / niceStep) * niceStep;
	const niceMax = Math.ceil(max / niceStep) * niceStep;
	const result: number[] = [];
	for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
		result.push(Math.round(v * 1e6) / 1e6);
	}
	return result;
}
