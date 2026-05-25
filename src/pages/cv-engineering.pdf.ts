import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function GET() {
	const path = join(process.cwd(), 'src/cv/cv-engineering.pdf');
	const pdf = await readFile(path);

	return new Response(pdf, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline; filename="debanjan-basu-cv-engineering.pdf"',
		},
	});
}
