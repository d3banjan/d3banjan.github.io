<script lang="ts">
	interface OutputRow {
		label: string;
		/** Multiply slider value by this (result = value * multiply) */
		multiply: number;
		/** If set, result = dividend / (value * multiply) instead */
		dividend?: number;
		prefix?: string;
		suffix?: string;
		/** Decimal places (default 0) */
		fixed?: number;
		/** Text to show when slider is 0 */
		zeroText?: string;
	}

	interface ReferenceMarker {
		label: string;
		value: number;
	}

	interface Props {
		title?: string;
		sliderLabel: string;
		min: number;
		max: number;
		step: number;
		initialValue: number;
		unit?: string;
		outputs: OutputRow[];
		references?: ReferenceMarker[];
	}

	let {
		title = '',
		sliderLabel,
		min,
		max,
		step,
		initialValue,
		unit = '',
		outputs,
		references = [],
	}: Props = $props();

	let value = $state(initialValue);

	function pct(v: number): number {
		return ((v - min) / (max - min || 1)) * 100;
	}

	function computeOutput(out: OutputRow, v: number): string {
		if (v === 0 && out.zeroText) return out.zeroText;
		const product = v * out.multiply;
		const raw = out.dividend != null ? out.dividend / (product || 1) : product;
		const fixed = out.fixed ?? 0;
		const num = fixed > 0 ? raw.toFixed(fixed) : String(Math.round(raw));
		return `${out.prefix || ''}${num}${out.suffix || ''}`;
	}
</script>

<div class="slider-sim">
	{#if title}
		<div class="sim-title">{title}</div>
	{/if}

	<div class="slider-row">
		<label class="slider-label" for="sim-slider">{sliderLabel}</label>
		<div class="slider-track-wrapper">
			<input
				id="sim-slider"
				type="range"
				{min} {max} {step}
				bind:value={value}
				class="slider-input"
			/>
			<!-- Reference markers -->
			{#each references as ref}
				<div
					class="ref-marker"
					style:left="{pct(ref.value)}%"
					title={ref.label}
				>
					<div class="ref-tick"></div>
					<span class="ref-label">{ref.label}</span>
				</div>
			{/each}
		</div>
		<span class="slider-value">{value}{unit}</span>
	</div>

	<div class="outputs">
		{#each outputs as out}
			<div class="output-row">
				<span class="output-label">{out.label}</span>
				<span class="output-value">{computeOutput(out, value)}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.slider-sim {
		margin: 1.5em 0;
		padding: 1.2em;
		border: 1px solid rgb(var(--gray-light));
		border-radius: 8px;
		background: rgba(var(--gray-light), 0.2);
	}
	.sim-title {
		font-weight: 700;
		font-size: 0.95em;
		color: rgb(var(--gray-dark));
		margin-bottom: 0.8em;
		text-align: center;
	}
	.slider-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 1em;
		flex-wrap: wrap;
	}
	.slider-label {
		font-size: 0.85em;
		color: rgb(var(--gray));
		white-space: nowrap;
		min-width: 100px;
	}
	.slider-track-wrapper {
		position: relative;
		flex: 1;
		min-width: 150px;
		padding-bottom: 20px;
	}
	.slider-input {
		width: 100%;
		accent-color: var(--accent);
		cursor: pointer;
	}
	.slider-value {
		font-weight: 700;
		font-size: 1.1em;
		color: var(--accent);
		min-width: 60px;
		text-align: right;
	}
	.ref-marker {
		position: absolute;
		top: 22px;
		transform: translateX(-50%);
		text-align: center;
	}
	.ref-tick {
		width: 2px;
		height: 8px;
		background: rgb(var(--gray));
		margin: 0 auto;
	}
	.ref-label {
		font-size: 0.7em;
		color: rgb(var(--gray));
		white-space: nowrap;
	}
	.outputs {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px;
	}
	.output-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 10px;
		background: rgba(var(--gray-light), 0.4);
		border-radius: 4px;
	}
	.output-label {
		font-size: 0.85em;
		color: rgb(var(--gray));
	}
	.output-value {
		font-weight: 700;
		font-size: 0.9em;
		color: rgb(var(--gray-dark));
	}
	@media (max-width: 500px) {
		.slider-row {
			flex-direction: column;
			align-items: stretch;
		}
		.slider-value {
			text-align: center;
		}
	}
</style>
