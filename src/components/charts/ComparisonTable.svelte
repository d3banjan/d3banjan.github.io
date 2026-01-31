<script lang="ts">
	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		highlight?: boolean;
	}

	interface Props {
		columns: Column[];
		rows: Record<string, string | number>[];
		title?: string;
		/** Row index to highlight (e.g. the "best" row) */
		highlightRow?: number;
	}

	let {
		columns,
		rows,
		title = '',
		highlightRow = -1,
	}: Props = $props();

	let sortKey = $state('');
	let sortAsc = $state(true);

	function sortedRows() {
		if (!sortKey) return rows;
		return [...rows].sort((a, b) => {
			const va = a[sortKey] ?? '';
			const vb = b[sortKey] ?? '';
			if (typeof va === 'number' && typeof vb === 'number') {
				return sortAsc ? va - vb : vb - va;
			}
			return sortAsc
				? String(va).localeCompare(String(vb))
				: String(vb).localeCompare(String(va));
		});
	}

	function handleSort(key: string) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}
</script>

<div class="comparison-table-wrapper">
	{#if title}
		<div class="table-title">{title}</div>
	{/if}

	<!-- Desktop table -->
	<div class="table-desktop">
		<table>
			<thead>
				<tr>
					{#each columns as col}
						<th
							class:sortable={col.sortable}
							class:highlight-col={col.highlight}
							onclick={() => col.sortable && handleSort(col.key)}
						>
							{col.label}
							{#if col.sortable}
								<span class="sort-icon">
									{#if sortKey === col.key}
										{sortAsc ? '\u25B2' : '\u25BC'}
									{:else}
										\u25BD
									{/if}
								</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sortedRows() as row, ri}
					{@const originalIndex = rows.indexOf(row)}
					<tr class:highlight-row={originalIndex === highlightRow}>
						{#each columns as col}
							<td class:highlight-col={col.highlight}>{row[col.key] ?? ''}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Mobile cards -->
	<div class="table-mobile">
		{#each sortedRows() as row, ri}
			{@const originalIndex = rows.indexOf(row)}
			<div class="card" class:highlight-row={originalIndex === highlightRow}>
				{#each columns as col}
					<div class="card-field">
						<span class="card-label">{col.label}</span>
						<span class="card-value" class:highlight-col={col.highlight}>{row[col.key] ?? ''}</span>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.comparison-table-wrapper {
		margin: 1.5em 0;
	}
	.table-title {
		font-weight: 700;
		font-size: 0.95em;
		color: rgb(var(--gray-dark));
		margin-bottom: 0.5em;
		text-align: center;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85em;
	}
	th, td {
		padding: 8px 10px;
		text-align: left;
		border-bottom: 1px solid rgb(var(--gray-light));
	}
	th {
		font-weight: 700;
		color: rgb(var(--gray-dark));
		background: rgba(var(--gray-light), 0.3);
	}
	th.sortable {
		cursor: pointer;
		user-select: none;
	}
	th.sortable:hover {
		background: rgba(var(--gray-light), 0.6);
	}
	.sort-icon {
		font-size: 0.7em;
		margin-left: 4px;
		opacity: 0.6;
	}
	.highlight-row {
		background: rgba(var(--gray-light), 0.3);
	}
	.highlight-col {
		font-weight: 700;
		color: var(--accent);
	}
	.table-mobile {
		display: none;
	}
	@media (max-width: 600px) {
		.table-desktop {
			display: none;
		}
		.table-mobile {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.card {
			border: 1px solid rgb(var(--gray-light));
			border-radius: 8px;
			padding: 12px;
			background: rgba(var(--gray-light), 0.15);
		}
		.card.highlight-row {
			border-color: var(--accent);
		}
		.card-field {
			display: flex;
			justify-content: space-between;
			padding: 4px 0;
			border-bottom: 1px solid rgba(var(--gray-light), 0.5);
		}
		.card-field:last-child {
			border-bottom: none;
		}
		.card-label {
			font-size: 0.8em;
			color: rgb(var(--gray));
		}
		.card-value {
			font-size: 0.85em;
			font-weight: 600;
			color: rgb(var(--gray-dark));
		}
	}
</style>
