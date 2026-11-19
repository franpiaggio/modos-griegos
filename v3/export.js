// Exporta posiciones sueltas (o el mástil) como PNG, SVG o PDF, con las fuentes incrustadas.
import { sheetSvg, boxOf } from './render.js';

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400&family=Oswald:wght@300;700&family=Questrial&display=block';
const DRAW_CSS = `
.num{font-family:'Questrial',sans-serif;font-size:15px;text-anchor:middle;fill:#1E1E1E}
.dn{font-family:'Questrial',sans-serif;font-size:13px;text-anchor:middle}
.num.sm,.dn.sm{font-size:11.5px}
.sn{font-family:'Questrial',sans-serif;font-size:13px;fill:#1E1E1E}
.rom{font-family:'Questrial',sans-serif;font-size:19.5px}
.nr{font-size:16.5px;fill:#ADADAD}
.title{font-family:'Oswald',sans-serif;font-size:22.6px;fill:#111}
.lg{font-family:'Comfortaa',sans-serif;font-size:13.4px}
.lx{font-family:'Comfortaa',sans-serif;font-size:14px;text-anchor:middle}`;

let fontCssPromise = null;
const toDataUrl = (blob) => new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = err; r.readAsDataURL(blob); });

// Descarga las fuentes (subconjunto latino) y las convierte en data URLs para que el archivo se vea igual en cualquier lado.
function fontCss() {
  fontCssPromise ||= (async () => {
    const css = await (await fetch(FONTS_URL)).text();
    const blocks = css.split('/*').map((b) => b.trim()).filter((b) => b.startsWith('latin */'));
    const out = await Promise.all(blocks.map(async (b) => {
      const face = b.slice(b.indexOf('@font-face'));
      const url = face.match(/url\((https:[^)]+)\)/)[1];
      const data = await toDataUrl(await (await fetch(url)).blob());
      return face.replace(url, data);
    }));
    return out.join('\n');
  })().catch((e) => { fontCssPromise = null; throw e; });
  return fontCssPromise;
}

// SVG independiente de una posición (siempre horizontal, como en el libro) o del mástil.
export async function pieceSvg(opts, i, { header = true } = {}) {
  const tmp = document.createElement('div');
  tmp.innerHTML = sheetSvg(opts);
  const svg = tmp.querySelector('svg');
  svg.querySelectorAll(i === 'neck' ? '.pos' : `.pos:not([data-i="${i}"]), .neck`).forEach((g) => g.remove());
  svg.querySelectorAll('.hit, .ring').forEach((e) => e.remove());
  svg.removeAttribute('class');
  let [x, y, w, h] = boxOf(i);
  if (!header) svg.querySelectorAll('svg > rect:first-child, .title, .legend').forEach((e) => e.remove());
  else {
    // encabezado compacto arriba de la pieza: título + leyenda, como en la hoja
    const hdr = svg.querySelector(':scope > rect');
    const title = svg.querySelector('.title');
    const legend = svg.querySelector('.legend');
    const hy = Number(hdr.getAttribute('y'));
    const dy = y - 12 - (hy + Number(hdr.getAttribute('height')));
    [hdr, title, legend].forEach((e) => e && e.setAttribute('transform', `translate(0 ${dy}) ${e.getAttribute('transform') || ''}`));
    hdr.setAttribute('x', x + 6); hdr.setAttribute('width', w - 12);
    title.setAttribute('transform', `translate(0 ${dy}) translate(${x + 14},${hy + 25.95}) scale(0.86,1)`);
    // la leyenda se alinea a la derecha de la pieza
    const lis = [...legend.querySelectorAll('.li')];
    let right = x + w - 18;
    lis.reverse().forEach((li) => {
      const t = li.querySelector('.lg');
      const live = document.querySelector('#paper .legend .lg');
      const tw = live ? live.getComputedTextLength() : 60;
      const lx = right - (tw + Number(t.getAttribute('x')));
      li.setAttribute('transform', `translate(${lx},0)`);
      right = lx - 15.8;
    });
    h += y - (hy + dy) + 4;
    y = hy + dy - 4;
  }
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  const css = await fontCss().catch(() => '');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = css + DRAW_CSS;
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  Object.entries({ x, y, width: w, height: h, fill: '#fff' }).forEach(([k, v]) => bg.setAttribute(k, v));
  svg.prepend(style, bg);
  return { text: new XMLSerializer().serializeToString(svg), w, h };
}

export async function pngBlob(piece, scale = 3) {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([piece.text], { type: 'image/svg+xml' }));
  await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = url; });
  // da tiempo a que las fuentes incrustadas se apliquen
  await new Promise((r) => setTimeout(r, 60));
  const c = document.createElement('canvas');
  c.width = Math.round(piece.w * scale);
  c.height = Math.round(piece.h * scale);
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}

export function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// PDF de una sola pieza: imprime solo ese SVG en una hoja del tamaño justo.
export function printPiece(piece) {
  const wmm = 190;
  const hmm = (wmm * piece.h) / piece.w;
  const box = document.createElement('div');
  box.className = 'print-one';
  box.innerHTML = piece.text;
  const st = document.createElement('style');
  st.textContent = `@page { size: ${wmm + 20}mm ${Math.ceil(hmm) + 24}mm; margin: 10mm; }
@media print { body > *:not(.print-one) { display: none !important; } .print-one { display: block !important; } .print-one svg { display: block; width: ${wmm}mm; height: ${hmm}mm; } html, body { height: auto !important; overflow: visible !important; } }
.print-one { display: none; }`;
  document.body.append(st, box);
  const done = () => { st.remove(); box.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 80);
}

let jszip = null;
async function loadZip() {
  if (window.JSZip) return window.JSZip;
  jszip ||= new Promise((ok, err) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload = () => ok(window.JSZip);
    s.onerror = err;
    document.head.appendChild(s);
  });
  return jszip;
}

// Todas las posiciones por separado (PNG + SVG) en un ZIP.
export async function zipAll(opts, list, base, onProgress = () => {}) {
  const JSZip = await loadZip();
  const zip = new JSZip();
  let n = 0;
  for (const i of list) {
    const piece = await pieceSvg(opts, i);
    const name = i === 'neck' ? `${base}-mastil` : `${base}-posicion-${i + 1}`;
    zip.file(`svg/${name}.svg`, piece.text);
    zip.file(`png/${name}.png`, await pngBlob(piece));
    onProgress(++n, list.length);
  }
  return zip.generateAsync({ type: 'blob' });
}

export const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[()]/g, '').replace(/[^a-zA-Z0-9#]+/g, '-').replace(/#/g, 's').replace(/^-|-$/g, '').toLowerCase();
