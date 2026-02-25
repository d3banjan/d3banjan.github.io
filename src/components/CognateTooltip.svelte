<script lang="ts">
	interface Props {
		latin: string;
		bengali: string;
		meaning: string;
	}

	let { latin, bengali, meaning }: Props = $props();
</script>

<span class="cognate">
	<span class="bengali-term">{bengali}</span>
	<span class="ct-tooltip">
		<span class="phonetic">{latin}</span>
		<span class="sep">·</span>
		<span class="gloss">{meaning}</span>
	</span>
</span>

<style>
	.cognate {
		position: relative;
		display: inline;
	}

	.bengali-term {
		text-decoration: underline dotted;
		text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
		text-underline-offset: 3px;
		cursor: help;
	}

	.ct-tooltip {
		display: none;
		position: absolute;
		bottom: calc(100% + 7px);
		left: 50%;
		transform: translateX(-50%);
		background: rgb(var(--gray-dark));
		color: rgb(var(--gray-light));
		padding: 5px 10px;
		border-radius: 5px;
		font-size: 0.78em;
		line-height: 1.4;
		white-space: nowrap;
		z-index: 100;
		pointer-events: none;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		font-family: inherit;
		font-style: normal;
	}

	/* Downward arrow */
	.ct-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: rgb(var(--gray-dark));
	}

	.cognate:hover .ct-tooltip {
		display: block;
	}

	.phonetic {
		font-style: italic;
	}

	.sep {
		margin: 0 5px;
		opacity: 0.45;
	}

	.gloss {
		opacity: 0.9;
	}
</style>
