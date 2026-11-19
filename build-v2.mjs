// Versión 2: siguiendo el modelo "Posición Escala Mayor" (7 posiciones por página).
// Genera v2/index.html (tónica en negro) y v2/colores.html (un color por modo).
// Unidades: píxeles a 150 dpi (1 px del modelo JPEG = K px). Mismo diseño y tamaños que la versión 1.
import { writeFileSync, mkdirSync } from 'node:fs';
import { toolbarCss, toolbarHtml, toolbarJs } from './toolbar.mjs';
import { MAJOR7, MODES } from './data-v2.mjs';

const K = 1240 / 769; // escala del modelo (769 x 1280 px) a 150 dpi
const W = 1240, H = Math.round(1280 * K); // 1240 x 2064 -> 210 x 349.5 mm
const PAGE_MM = [210, +(210 * H / W).toFixed(1)];
const k = (v) => +(v * K).toFixed(2);

const C = {
  red: '#CE3468', orange: '#EE9B3B', black: '#1E1E1E',
  header: '#EAEAEA', nut: '#7D7D7D', bar: '#3A3A3A',
  string: '#C2C2C2', fret: '#C8C8C8', neckString: '#B4B4B4', neckFret: '#D2D2D2', outline: '#B4B4B4',
  text: '#1E1E1E', label2: '#ADADAD',
};
const F = {
  num: "'Questrial', 'Century Gothic', sans-serif",
  title: "'Oswald', sans-serif",
  legend: "'Comfortaa', sans-serif",
};

const OPEN = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pc = (s, f) => (OPEN[s] + f) % 12;

// ---- Geometría medida del modelo (en px del JPEG, se escala con K) ----
const STRING_YS = [
  [117, 142, 167, 192.5, 218, 243],
  [277, 302.5, 328, 353, 378.5, 404],
  [439, 464.5, 490, 515, 540.5, 565.5],
  [604.5, 630, 655, 680.5, 705.5, 731],
  [775.5, 801, 826, 851.5, 877, 902],
  [950, 975, 1000, 1025.5, 1051, 1076],
  [1121, 1146, 1171.5, 1197, 1222, 1247.5],
];
const FRETS = [153.5, 232, 309.5, 387, 464.5].map(k);
const LINE_END = k(487);
const BAR = [k(69), k(71.2)];
const NUT = [k(68), k(77)];
// Etiqueta romana: [texto, x izquierda, base] en px del modelo
const LABELS = [
  [['I', 77.5, 108.5], ['V', 387.5, 109.5]],
  [['III', 75.5, 273.5]],
  [['V', 73.5, 434.5]],
  [['VII', 73.5, 597.5]],
  [['VIII', 76.5, 768.5]],
  [['X', 77.5, 942.5]],
  [['XII', 75.5, 1113.5]],
];

const NECK = {
  xs: [533, 563.5, 594, 624.5, 655, 685.5].map(k), // cuerda 6 .. 1
  nut: [k(113), k(124)],
  zero: k(121),
  frets: [168, 213, 260, 306.5, 353.5, 400.5, 447, 494, 541, 588, 634.5, 681.5, 728, 775, 822, 868.5, 914.5, 961, 1007, 1053.5].map(k),
  end: k(1076),
};
const neckCellY = (f) => {
  const all = [NECK.zero, ...NECK.frets];
  return (all[f - 1] + all[f]) / 2 + 2.6;
};

const HDR = { x: k(62), w: k(694.5) - k(62), y: k(70.75) - 18.4, h: 36.75 };
const LEGEND_RIGHT = k(693);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---- Dibujo ----
function marker(kind, color, x, y, label, big, vary) {
  const out = [];
  if (kind === 'tonic') {
    out.push(`<circle cx="${x}" cy="${y}" r="${big ? 15.2 : 14.3}" fill="${color}"${vary ? ` class="tn" style="--c:${color}"` : ''}/>`);
    if (label != null) out.push(`<text x="${x}" y="${y + 4.6}" class="dn" fill="#fff">${label}</text>`);
  } else if (kind === 'square') {
    const s = big ? 26.2 : 25.2;
    out.push(`<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="#fff" stroke="${color}" stroke-width="1.5"/>`);
    if (label != null) out.push(`<text x="${x}" y="${y + 4.6}" class="dn" fill="${color}">${label}</text>`);
  } else if (big) {
    out.push(`<circle cx="${x}" cy="${y}" r="15.4" fill="#fff" stroke="${C.outline}" stroke-width="1.2"/>`);
  } else {
    out.push(`<rect x="${x - 11.5}" y="${y - 6}" width="23" height="12" fill="#fff"/>`);
    out.push(`<text x="${x}" y="${y + 5.2}" class="num">${label}</text>`);
  }
  return out.join('');
}

function markFor(page, s, f) {
  const p = pc(s, f);
  if (page.circle && p === PC[page.circle.note]) return ['tonic', page.circle.color];
  if (page.square && p === PC[page.square.note]) return ['square', page.square.color];
  return ['plain'];
}

function diagram(page, d, pos) {
  const ys = STRING_YS[d].map(k);
  const left = d === 0 ? NUT[1] : BAR[1];
  const out = [];
  ys.forEach((y) => out.push(`<line x1="${left}" y1="${y}" x2="${LINE_END}" y2="${y}" stroke="${C.string}" stroke-width="1"/>`));
  FRETS.forEach((x) => out.push(`<line x1="${x}" y1="${ys[0]}" x2="${x}" y2="${ys[5]}" stroke="${C.fret}" stroke-width="1"/>`));
  if (d === 0) {
    out.push(`<rect x="${NUT[0]}" y="${ys[0]}" width="${NUT[1] - NUT[0]}" height="${ys[5] - ys[0]}" fill="${C.nut}"/>`);
    ys.slice(1, 5).forEach((y) => out.push(`<line x1="${NUT[0]}" y1="${y}" x2="${NUT[1]}" y2="${y}" stroke="#9a9a9a" stroke-width="0.8"/>`));
  } else {
    out.push(`<rect x="${BAR[0]}" y="${ys[0]}" width="${BAR[1] - BAR[0]}" height="${ys[5] - ys[0]}" fill="${C.bar}"/>`);
  }
  out.push(`<text x="${d === 0 ? 98.5 : 96.5}" y="${ys[0] + (d === 0 ? -4 : 1.6)}" class="sn">1</text>`);
  out.push(`<text x="${d === 0 ? 98.75 : 96.5}" y="${ys[5] + (d === 0 ? -0.75 : 1.75)}" class="sn">6</text>`);
  LABELS[d].forEach(([t, x, b], i) => out.push(`<text x="${k(x)}" y="${k(b)}" class="rom" fill="${i === 0 ? C.text : C.label2}">${t}</text>`));
  const edges = [left, ...FRETS];
  pos.notes.forEach(([s, f, finger]) => {
    const cell = f - pos.start;
    const x = (edges[cell] + edges[cell + 1]) / 2 + 0.5;
    const [kind, color] = markFor(page, s, f);
    out.push(marker(kind, color, x, ys[s - 1], finger, false, page.vary));
  });
  return out.join('\n');
}

function neck(page) {
  const out = [];
  NECK.frets.forEach((y) => out.push(`<line x1="${NECK.xs[0]}" y1="${y}" x2="${NECK.xs[5]}" y2="${y}" stroke="${C.neckFret}" stroke-width="1"/>`));
  NECK.xs.forEach((x) => out.push(`<line x1="${x}" y1="${NECK.nut[0]}" x2="${x}" y2="${NECK.end}" stroke="${C.neckString}" stroke-width="1.1"/>`));
  out.push(`<rect x="${NECK.xs[0]}" y="${NECK.nut[0]}" width="${NECK.xs[5] - NECK.xs[0]}" height="${NECK.nut[1] - NECK.nut[0]}" fill="${C.nut}"/>`);
  NECK.xs.slice(1, 5).forEach((x) => out.push(`<line x1="${x}" y1="${NECK.nut[0]}" x2="${x}" y2="${NECK.nut[1]}" stroke="#9a9a9a" stroke-width="0.8"/>`));
  out.push(`<text transform="translate(${NECK.xs[0] + 7},${k(108)}) rotate(90)" class="sn" font-size="15" text-anchor="middle" dominant-baseline="central">6</text>`);
  out.push(`<text transform="translate(${NECK.xs[5] + 8.6},${k(108)}) rotate(90)" class="sn" font-size="15" text-anchor="middle" dominant-baseline="central">1</text>`);
  [[2, 'II'], [5, 'V'], [7, 'VII'], [10, 'X'], [12, 'XII']].forEach(([f, t]) => {
    const y = [NECK.zero, ...NECK.frets][f - 1] + 1.5;
    out.push(`<text transform="translate(${NECK.xs[5] + 18.4},${y}) rotate(90)" class="rom nr" dominant-baseline="central">${t}</text>`);
  });
  const seen = new Set();
  page.positions.forEach((p) => p.notes.forEach(([s, f]) => seen.add(`${s}:${f}`)));
  [...seen].forEach((key) => {
    const [s, f] = key.split(':').map(Number);
    const [kind, color] = markFor(page, s, f);
    out.push(marker(kind, color, NECK.xs[6 - s], neckCellY(f), null, true, page.vary));
  });
  return out.join('\n');
}

function header(page) {
  const out = [];
  const cy = HDR.y + 18.85;
  out.push(`<rect x="${HDR.x}" y="${HDR.y}" width="${HDR.w}" height="${HDR.h}" fill="${C.header}"/>`);
  out.push(`<text transform="translate(${k(68) - 0.5},${HDR.y + 25.95}) scale(0.86,1)" class="title"><tspan font-weight="300">${esc(page.title[0])}</tspan> <tspan font-weight="700">${esc(page.title[1])}</tspan></text>`);
  out.push(`<g class="legend">`);
  page.legend.forEach((l) => {
    out.push(`<g class="li">`);
    if (l.kind === 'tonic') {
      out.push(`<circle cx="13.25" cy="${cy}" r="13.25" fill="${l.color}"${page.vary ? ` class="tn" style="--c:${l.color}"` : ''}/>`);
      out.push(`<text x="13.25" y="${cy + 5}" class="lx" fill="#fff">X</text>`);
      out.push(`<text x="31.6" y="${cy + 6.2}" class="lg${page.vary ? ' tn' : ''}"${page.vary ? ` style="--c:${l.color}"` : ''} fill="${l.color}">${esc(l.text)}</text>`);
    } else {
      out.push(`<rect x="0.75" y="${cy - 10.35}" width="20.5" height="20.5" fill="none" stroke="${l.color}" stroke-width="1.5"/>`);
      out.push(`<text x="11" y="${cy + 5}" class="lx" fill="${l.color}">X</text>`);
      out.push(`<text x="30" y="${cy + 6.2}" class="lg" fill="${l.color}">${esc(l.text)}</text>`);
    }
    out.push('</g>');
  });
  out.push('</g>');
  return out.join('\n');
}

const page = (p) => `<section class="page" id="${p.id}"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title.join(' '))}">
${header(p)}
${p.positions.map((pos, i) => diagram(p, i, pos)).join('\n')}
${neck(p)}
</svg></section>`;

function html(pages, pdf, other) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Modos griegos – Guitarra (v2)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400&family=Oswald:wght@300;700&family=Questrial&display=block" rel="stylesheet">
<style>
  @page { size: ${PAGE_MM[0]}mm ${PAGE_MM[1]}mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #d9d9d9; }
${toolbarCss}
  .page { width: ${PAGE_MM[0]}mm; height: ${PAGE_MM[1]}mm; margin: 16px auto; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.25); overflow: hidden; }
  .page svg { display: block; width: 100%; height: 100%; }
  @media screen and (max-width: 840px) { .page { width: calc(100vw - 32px); height: calc((100vw - 32px) * ${(H / W).toFixed(5)}); } }
  @media print {
    html, body { background: #fff; }
    .page { margin: 0; box-shadow: none; width: ${PAGE_MM[0]}mm; height: ${PAGE_MM[1]}mm; break-after: page; }
  }
  .num { font-family: ${F.num}; font-size: 15px; text-anchor: middle; fill: ${C.text}; }
  .dn { font-family: ${F.num}; font-size: 13px; text-anchor: middle; }
  .sn { font-family: ${F.num}; font-size: 13px; fill: ${C.text}; }
  .rom { font-family: ${F.num}; font-size: 19.5px; }
  .nr { font-size: 16.5px; fill: ${C.label2}; }
  .title { font-family: ${F.title}; font-size: 22.6px; fill: #111; }
  .lg { font-family: ${F.legend}; font-size: 13.4px; }
  .lx { font-family: ${F.legend}; font-size: 14px; text-anchor: middle; }
  .tn { fill: var(--c); }
  body.negro .tn { fill: ${C.black}; }
  body.negro .toolbar .tabs a[data-mode] { --dot: ${C.black} !important; }
</style>
</head>
<body>
<script>document.body.className = new URLSearchParams(location.search).get('v') === 'colores' ? 'colores' : 'negro';</script>
${toolbarHtml({ pages, pdf, subtitle: 'Versión 2 · 7 posiciones', variants: other })}
${pages.map(page).join('\n')}
<script>
${toolbarJs}
// Alinea la leyenda a la derecha de la barra, como en el modelo.
document.fonts.ready.then(() => {
  document.querySelectorAll('.legend').forEach((lg) => {
    let right = ${LEGEND_RIGHT};
    [...lg.querySelectorAll('.li')].reverse().forEach((li) => {
      const t = li.querySelector('.lg');
      const x = right - (t.getComputedTextLength() + Number(t.getAttribute('x')));
      li.setAttribute('transform', 'translate(' + x + ',0)');
      right = x - 15.8;
    });
  });
});
</script>
</body>
</html>
`;
}

// ---- Páginas ----
const reference = {
  id: 'escala-mayor', dot: C.red, nav: 'Escala Mayor', title: ['Posición', 'Escala Mayor'],
  circle: { note: 'C', color: C.red }, square: { note: 'A', color: C.orange },
  legend: [{ kind: 'tonic', color: C.red, text: 'Tónica mayor' }, { kind: 'square', color: C.orange, text: 'Tónica menor' }],
  positions: MAJOR7,
};
const modePages = (colorOf) => MODES.map((m) => ({
  id: m.id, dot: colorOf(m), vary: true, nav: m.name, title: ['Modo', m.name],
  circle: { note: m.note, color: colorOf(m) },
  legend: [{ kind: 'tonic', color: colorOf(m), text: `Tónica ${m.nombre}` }],
  positions: MAJOR7,
}));

mkdirSync(new URL('./v2/', import.meta.url), { recursive: true });
const pages = [reference, ...modePages((m) => m.color)];
const PDFS = { negro: 'modos-tonica-negra.pdf', colores: 'modos-colores.pdf' };
const variants = [{ v: 'negro', label: 'Tónica negra', pdf: PDFS.negro }, { v: 'colores', label: 'Color por modo', pdf: PDFS.colores }];
writeFileSync(new URL('./v2/index.html', import.meta.url), html(pages, PDFS.negro, variants));
// Enlace viejo: redirige a la variante de colores
writeFileSync(new URL('./v2/colores.html', import.meta.url), `<!doctype html><meta charset="utf-8"><title>Modos griegos</title><script>location.replace('index.html?v=colores' + location.hash)</script><a href="index.html?v=colores">Ir a la versión de colores</a>
`);
console.log('v2: index.html (2 variantes),', pages.length, 'páginas');
