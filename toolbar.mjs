// Barra superior compartida por todas las versiones (solo pantalla; no se imprime).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const ICON = {
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
  print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z"/></svg>',
};

export const toolbarCss = `
  .toolbar { position: sticky; top: 0; z-index: 10; background: rgba(255,255,255,.86); backdrop-filter: saturate(1.6) blur(14px);
    -webkit-backdrop-filter: saturate(1.6) blur(14px); border-bottom: 1px solid rgba(0,0,0,.07);
    font: 500 14px/1.2 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1b1b1f; }
  .toolbar .row { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding: 10px 16px; }
  .toolbar .brand { display: flex; flex-direction: column; gap: 2px; white-space: nowrap; }
  .toolbar .brand b { font: 700 15px/1 Oswald, sans-serif; letter-spacing: .02em; text-transform: uppercase; }
  .toolbar .brand span { font-size: 11.5px; color: #8a8a93; font-weight: 500; }
  .toolbar .tabs { flex: 1 1 auto; min-width: 0; display: flex; gap: 2px; padding: 3px; background: #f1f1f3; border-radius: 999px; overflow-x: auto; scrollbar-width: none; }
  .toolbar .tabs::-webkit-scrollbar { display: none; }
  .toolbar .tabs a { flex: 0 0 auto; padding: 7px 11px; font-size: 13.5px; border-radius: 999px; color: #5b5b66; text-decoration: none; transition: background .15s, color .15s, box-shadow .15s; }
  .toolbar .tabs a:hover { color: #1b1b1f; }
  .toolbar .tabs a.on { background: #fff; color: #1b1b1f; box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04); }
  .toolbar .tabs a.on::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: var(--dot, #CE3468); vertical-align: 1px; }
  .toolbar .actions { display: flex; align-items: center; gap: 8px; }
  .toolbar .btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid #e3e3e8;
    background: #fff; color: #1b1b1f; font: inherit; text-decoration: none; cursor: pointer; white-space: nowrap; transition: background .15s, border-color .15s, transform .1s; }
  .toolbar .btn:hover { background: #f6f6f8; border-color: #d4d4db; }
  .toolbar .btn:active { transform: translateY(1px); }
  .toolbar .btn svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .toolbar .btn.primary { background: #1b1b1f; border-color: #1b1b1f; color: #fff; }
  .toolbar .btn.primary:hover { background: #2d2d33; }
  .toolbar .switch { display: inline-flex; padding: 3px; background: #f1f1f3; border-radius: 10px; }
  .toolbar .switch button { border: 0; background: none; font: inherit; cursor: pointer; padding: 6px 10px; border-radius: 8px; color: #5b5b66; text-decoration: none; font-size: 13px; white-space: nowrap; }
  .toolbar .switch button.on { background: #fff; color: #1b1b1f; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
  .toolbar :focus-visible { outline: 2px solid #2C6DB5; outline-offset: 2px; }
  @media (max-width: 1180px) { .toolbar .btn .label { display: none; } .toolbar .btn { padding: 0 10px; } }
  @media (max-width: 900px) {
    .toolbar .row { flex-wrap: wrap; gap: 10px; }
    .toolbar .brand { flex: 1 1 auto; }
    .toolbar .switch { order: 3; flex-basis: 100%; }
    .toolbar .switch button { flex: 1; text-align: center; }
    .toolbar .tabs { order: 4; flex-basis: 100%; }
  }
  @media print { .toolbar { display: none !important; } }
  html { scroll-padding-top: 76px; }
  @media (max-width: 900px) { html { scroll-padding-top: 120px; } }
`;

// pages: [{id, nav, dot?}], pdf: href, subtitle: texto chico, variants: [{href, label, on}] (opcional)
export function toolbarHtml({ pages, pdf, subtitle, variants }) {
  const sw = variants && variants.length
    ? `<div class="switch" role="group" aria-label="Variante" title="Cambia entre tónica negra y un color distinto por modo">${variants.map((v) => `<button type="button" data-v="${v.v}" data-pdf="${v.pdf}">${esc(v.label)}</button>`).join('')}</div>`
    : '';
  return `<nav class="toolbar"><div class="row">
<div class="brand"><b>Modos griegos</b><span>${esc(subtitle)}</span></div>
<div class="tabs">${pages.map((p, i) => `<a href="#${p.id}"${i === 0 ? ' class="on"' : ''}${p.dot ? ` style="--dot:${p.dot}"` : ''}${p.vary ? ' data-mode' : ''}>${esc(p.nav)}</a>`).join('')}</div>
${sw}
<div class="actions">
<a class="btn primary" id="pdf" href="${pdf}" download>${ICON.download}<span class="label">PDF</span></a>
<button class="btn" type="button" onclick="window.print()" title="Imprimir">${ICON.print}<span class="label">Imprimir</span></button>
</div></div></nav>`;
}

// Marca la pestaña de la página visible y maneja el selector de variante (sin recargar).
export const toolbarJs = `
(() => {
  const btns = [...document.querySelectorAll('.toolbar .switch button')];
  if (!btns.length) return;
  const set = (v) => {
    document.body.className = v;
    btns.forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    const b = btns.find((x) => x.dataset.v === v); if (b) document.getElementById('pdf').href = b.dataset.pdf;
    const u = new URL(location.href); u.searchParams.set('v', v); history.replaceState(null, '', u);
  };
  btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.v)));
  set(document.body.className || btns[0].dataset.v);
})();
(() => {
  const links = [...document.querySelectorAll('.toolbar .tabs a')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('on'));
      const a = byId.get(e.target.id);
      if (a) { a.classList.add('on'); const t = a.parentElement; t.scrollTo({ left: a.offsetLeft - t.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' }); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.page').forEach((p) => io.observe(p));
})();
`;
