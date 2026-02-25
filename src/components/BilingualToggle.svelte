<script lang="ts">
	const STORAGE_KEY = 'bilingual-lang';

	let lang = $state<'en' | 'bn'>('en');

	$effect(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as 'en' | 'bn' | null;
		if (stored === 'bn') {
			lang = 'bn';
			document.body.dataset.lang = 'bn';
		}
	});

	function toggle() {
		lang = lang === 'en' ? 'bn' : 'en';
		document.body.dataset.lang = lang;
		localStorage.setItem(STORAGE_KEY, lang);
	}
</script>

<div class="bilingual-toggle">
	<button onclick={toggle} aria-label="Switch language" title={lang === 'en' ? 'বাংলায় পড়ুন' : 'Read in English'}>
		{#if lang === 'en'}
			<span class="active">EN</span>
			<span class="divider">/</span>
			<span class="inactive">বাংলা</span>
		{:else}
			<span class="inactive">EN</span>
			<span class="divider">/</span>
			<span class="active">বাংলা</span>
		{/if}
	</button>
</div>

<style>
	.bilingual-toggle {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1.5rem;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 0;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 20px;
		padding: 4px 14px;
		background: transparent;
		cursor: pointer;
		font-size: 0.82em;
		letter-spacing: 0.03em;
		color: inherit;
		transition: border-color 0.15s;
	}

	button:hover {
		border-color: color-mix(in srgb, currentColor 55%, transparent);
	}

	.active {
		font-weight: 600;
		opacity: 1;
	}

	.inactive {
		opacity: 0.4;
	}

	.divider {
		margin: 0 6px;
		opacity: 0.3;
	}
</style>
