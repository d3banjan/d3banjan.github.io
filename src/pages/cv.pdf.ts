import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function GET() {
	const path = join(process.cwd(), 'src/cv/cv.pdf');
	const pdf = await readFile(path);

	return new Response(pdf, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'attachment; filename="debanjan-basu-cv.pdf"',
		},
	});
}
