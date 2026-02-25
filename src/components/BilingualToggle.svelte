<script lang="ts">
	const SCROLL_KEY = 'bilingual-scroll-ratio';

	let lang = $state<'en' | 'bn'>('en');
	let href = $state('#');

	$effect(() => {
		const path = window.location.pathname;
		lang = path.startsWith('/bn/') ? 'bn' : 'en';
		if (path.startsWith('/bn/')) {
			const slug = path.replace(/^\/bn\//, '').replace(/\/$/, '');
			href = `/blog/${slug}/`;
		} else {
			const slug = path.replace(/^\/blog\//, '').replace(/\/$/, '');
			href = `/bn/${slug}/`;
		}

		// On arrival: restore scroll position if we just toggled
		const saved = sessionStorage.getItem(SCROLL_KEY);
		if (saved !== null) {
			sessionStorage.removeItem(SCROLL_KEY);
			const ratio = parseFloat(saved);
			const target = ratio * (document.body.scrollHeight - window.innerHeight);
			window.scrollTo({ top: target, behavior: 'instant' });
		}
	});

	function handleClick() {
		const ratio = window.scrollY / (document.body.scrollHeight - window.innerHeight);
		sessionStorage.setItem(SCROLL_KEY, String(ratio));
	}
</script>

<div class="bilingual-toggle">
	<a {href} onclick={handleClick} aria-label="Switch language" title={lang === 'en' ? 'বাংলায় পড়ুন' : 'Read in English'}>
		{#if lang === 'en'}
			<span class="active">EN</span>
			<span class="divider">/</span>
			<span class="inactive">বাংলা</span>
		{:else}
			<span class="inactive">EN</span>
			<span class="divider">/</span>
			<span class="active">বাংলা</span>
		{/if}
	</a>
</div>

<style>
	.bilingual-toggle {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 100;
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: 0;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 20px;
		padding: 6px 16px;
		background: rgb(var(--gray-light, 241, 243, 249));
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		cursor: pointer;
		font-size: 0.82em;
		letter-spacing: 0.03em;
		color: inherit;
		text-decoration: none;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	a:hover {
		border-color: color-mix(in srgb, currentColor 55%, transparent);
		box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
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
