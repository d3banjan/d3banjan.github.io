import type { Plugin } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';

const EDITOR_SCRIPT = `
(function() {
  const meta = document.querySelector('meta[name="edit-source"]');
  if (!meta) return;
  const filePath = meta.getAttribute('content');

  // --- Overlay UI ---
  function createOverlay(content) {
    const overlay = document.createElement('div');
    overlay.id = '__dev-editor-overlay__';
    overlay.style.cssText = \`
      position: fixed; inset: 0; z-index: 99999;
      display: flex; flex-direction: column;
      background: #1e1e2e; color: #cdd6f4;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    \`;

    const header = document.createElement('div');
    header.style.cssText = \`
      display: flex; align-items: center; gap: 12px;
      padding: 8px 16px; background: #181825;
      border-bottom: 1px solid #313244; flex-shrink: 0;
    \`;
    header.innerHTML = \`
      <span style="color:#89b4fa;font-size:13px;flex:1">\${filePath}</span>
      <span style="color:#6c7086;font-size:12px">Ctrl+S to save · Esc to close</span>
      <button id="__dev-save__" style="
        background:#a6e3a1;color:#1e1e2e;border:none;
        padding:4px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:13px
      ">Save</button>
      <button id="__dev-close__" style="
        background:#f38ba8;color:#1e1e2e;border:none;
        padding:4px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:13px
      ">✕</button>
    \`;

    const textarea = document.createElement('textarea');
    textarea.id = '__dev-editor-textarea__';
    textarea.value = content;
    textarea.spellcheck = false;
    textarea.style.cssText = \`
      flex: 1; resize: none; border: none; outline: none;
      background: #1e1e2e; color: #cdd6f4;
      font-family: inherit; font-size: 13px; line-height: 1.6;
      padding: 16px; tab-size: 2;
    \`;

    const status = document.createElement('div');
    status.id = '__dev-editor-status__';
    status.style.cssText = \`
      padding: 4px 16px; background: #181825; font-size: 12px;
      color: #6c7086; border-top: 1px solid #313244; flex-shrink: 0;
    \`;
    status.textContent = 'Ready';

    overlay.appendChild(header);
    overlay.appendChild(textarea);
    overlay.appendChild(status);
    document.body.appendChild(overlay);

    function setStatus(msg, color) {
      status.textContent = msg;
      status.style.color = color || '#6c7086';
    }

    async function save() {
      setStatus('Saving…', '#f9e2af');
      try {
        const res = await fetch('/_edit/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: filePath, content: textarea.value }),
        });
        const json = await res.json();
        if (json.ok) {
          setStatus('Saved ✓ — reloading…', '#a6e3a1');
          // HMR will reload; close overlay preemptively
          setTimeout(() => overlay.remove(), 800);
        } else {
          setStatus('Error: ' + json.error, '#f38ba8');
        }
      } catch (e) {
        setStatus('Save failed: ' + e.message, '#f38ba8');
      }
    }

    document.getElementById('__dev-save__').addEventListener('click', save);
    document.getElementById('__dev-close__').addEventListener('click', () => overlay.remove());

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { overlay.remove(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
      // Tab key inserts spaces instead of losing focus
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, start) + '  ' + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    });

    textarea.focus();
    return overlay;
  }

  // --- Global Ctrl+S handler (when overlay is not open) ---
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      if (document.getElementById('__dev-editor-overlay__')) return; // already open
      e.preventDefault();
      await openEditor();
    }
  });

  async function openEditor() {
    if (document.getElementById('__dev-editor-overlay__')) return;
    try {
      const res = await fetch('/_edit/read?file=' + encodeURIComponent(filePath));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const content = await res.text();
      createOverlay(content);
    } catch (e) {
      console.error('[dev-editor] Failed to load file:', e);
    }
  }

  // --- Floating Edit button ---
  const btn = document.createElement('button');
  btn.textContent = '✏ Edit';
  btn.title = 'Edit MDX source (Ctrl+S)';
  btn.style.cssText = \`
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    background: #89b4fa; color: #1e1e2e; border: none;
    padding: 8px 16px; border-radius: 8px; cursor: pointer;
    font-weight: 600; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    opacity: 0.85; transition: opacity 0.15s;
  \`;
  btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '0.85');
  btn.addEventListener('click', openEditor);
  document.body.appendChild(btn);
})();
`;

export function devEditorPlugin(): Plugin {
	let projectRoot: string;

	return {
		name: 'dev-editor',
		apply: 'serve',

		configResolved(config) {
			projectRoot = config.root;
		},

		configureServer(server) {
			server.middlewares.use('/_edit/read', async (req, res, next) => {
				if (!req.url) return next();
				const url = new URL(req.url, 'http://localhost');
				const file = url.searchParams.get('file');
				if (!file) {
					res.statusCode = 400;
					res.end('Missing file param');
					return;
				}
				const fullPath = path.resolve(projectRoot, file);
				// Safety: must be inside project root
				if (!fullPath.startsWith(projectRoot)) {
					res.statusCode = 403;
					res.end('Forbidden');
					return;
				}
				try {
					const content = await fs.readFile(fullPath, 'utf-8');
					res.setHeader('Content-Type', 'text/plain; charset=utf-8');
					res.end(content);
				} catch {
					res.statusCode = 404;
					res.end('Not found');
				}
			});

			server.middlewares.use('/_edit/save', async (req, res, next) => {
				if (req.method !== 'POST') return next();
				let body = '';
				req.on('data', (chunk) => (body += chunk));
				req.on('end', async () => {
					try {
						const { file, content } = JSON.parse(body);
						const fullPath = path.resolve(projectRoot, file);
						if (!fullPath.startsWith(projectRoot)) {
							res.statusCode = 403;
							res.end(JSON.stringify({ error: 'Forbidden' }));
							return;
						}
						await fs.writeFile(fullPath, content, 'utf-8');
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ ok: true }));
					} catch (e) {
						res.statusCode = 500;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ error: String(e) }));
					}
				});
			});
		},

		transformIndexHtml() {
			return [
				{
					tag: 'script',
					injectTo: 'body' as const,
					children: EDITOR_SCRIPT,
				},
			];
		},
	};
}
