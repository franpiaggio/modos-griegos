// Genera index.html (todas las páginas) a partir de data.mjs.
// Unidades: píxeles a 150 dpi sobre una hoja A4 (1240 x 1754), igual que el original escaneado.
import { writeFileSync } from 'node:fs';
import { PAGES } from './data.mjs';

const W = 1240, H = 1754;
const C = {
  red: '#CE3468',
  orange: '#EE9B3B',
  header: '#EAEAEA',
  nut: '#7D7D7D',
  bar: '#3A3A3A',
  string: '#C2C2C2',
  fret: '#C8C8C8',
  neckString: '#B4B4B4',
  neckFret: '#D2D2D2',
  outline: '#B4B4B4',
  text: '#1E1E1E',
  label2: '#ADADAD',
};
const F = {
  num: "'Questrial', 'Century Gothic', sans-serif",
  title: "'Oswald', sans-serif",
  legend: "'Comfortaa', sans-serif",
};

// Semitonos de las cuerdas al aire, cuerda 1 (Mi aguda) a 6 (Mi grave)
const OPEN = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pc = (s, f) => (OPEN[s] + f) % 12;

// Geometría de los 5 diagramas horizontales (medida del original)
const DIAGRAMS = [
  { ys: [284, 324.5, 365, 406, 446.5, 487.5], left: 122.75, nut: [107.5, 122.75], frets: [246, 373, 498, 622.9, 748.4],
    s1: { x: 98.5, dy: -4 }, s6: { x: 98.75, dy: -0.75 } },
  { ys: [542.5, 583.5, 624, 665, 705.5, 746], left: 113.25, bar: [109.5, 113.25], frets: [247, 372, 496.9, 621.9, 746.9] },
  { ys: [803.5, 844, 885, 926, 967, 1007.5], left: 113.5, bar: [109.75, 113.5], frets: [245, 372, 497.25, 622.6, 747.1] },
  { ys: [1070, 1111, 1151.5, 1192.5, 1233.5, 1274], left: 113.5, bar: [109.75, 113.5], frets: [245, 372, 497.25, 622.6, 747.1] },
  { ys: [1346, 1387, 1427.5, 1468.5, 1509, 1550], left: 113.5, bar: [109.75, 113.5], frets: [245, 372, 497.25, 622.6, 747.1] },
];
const LINE_END = 783.25;

// Mástil vertical
const NECK = {
  xs: [858.4, 907.5, 956.6, 1005.75, 1054.9, 1103.9], // cuerda 6 .. 1
  nut: [278, 296],
  frets: [365.5, 439, 514.25, 590, 665.4, 741.1, 816.4, 892.1, 967.25, 1043.1, 1118.25, 1194, 1269.1, 1345, 1420.4, 1496.1],
  zero: 290,
  end: 1552,
};
const neckCellY = (f) => {
  const all = [NECK.zero, ...NECK.frets];
  return (all[f - 1] + all[f]) / 2 + 2.6;
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function marker(kind, x, y, label, big) {
  // kind: 'major' (círculo rojo), 'minor' (cuadrado naranja), 'plain' (número o círculo blanco)
  const out = [];
  if (kind === 'major') {
    const r = big ? 15.2 : 14.3;
    out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.red}"/>`);
    if (label != null) out.push(`<text x="${x}" y="${y + 4.6}" class="dn" fill="#fff">${label}</text>`);
  } else if (kind === 'minor') {
    const s = big ? 26.2 : 25.2;
    out.push(`<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="#fff" stroke="${C.orange}" stroke-width="1.5"/>`);
    if (label != null) out.push(`<text x="${x}" y="${y + 4.6}" class="dn" fill="${C.orange}">${label}</text>`);
  } else if (big) {
    out.push(`<circle cx="${x}" cy="${y}" r="15.4" fill="#fff" stroke="${C.outline}" stroke-width="1.2"/>`);
  } else {
    out.push(`<rect x="${x - 11.5}" y="${y - 6}" width="23" height="12" fill="#fff"/>`);
    out.push(`<text x="${x}" y="${y + 5.2}" class="num">${label}</text>`);
  }
  return out.join('');
}

function kindFor(page, s, f) {
  const p = pc(s, f);
  if (page.circle != null && p === PC[page.circle]) return 'major';
  if (page.square != null && p === PC[page.square]) return 'minor';
  return 'plain';
}

function diagram(page, d, pos) {
  const g = DIAGRAMS[d];
  const out = [];
  // cuerdas
  g.ys.forEach((y) => out.push(`<line x1="${g.left}" y1="${y}" x2="${LINE_END}" y2="${y}" stroke="${C.string}" stroke-width="1"/>`));
  // trastes
  g.frets.forEach((x) => out.push(`<line x1="${x}" y1="${g.ys[0]}" x2="${x}" y2="${g.ys[5]}" stroke="${C.fret}" stroke-width="1"/>`));
  // cejuela o barra
  if (g.nut) {
    out.push(`<rect x="${g.nut[0]}" y="${g.ys[0]}" width="${g.nut[1] - g.nut[0]}" height="${g.ys[5] - g.ys[0]}" fill="${C.nut}"/>`);
    g.ys.slice(1, 5).forEach((y) => out.push(`<line x1="${g.nut[0]}" y1="${y}" x2="${g.nut[1]}" y2="${y}" stroke="#9a9a9a" stroke-width="0.8"/>`));
  } else {
    out.push(`<rect x="${g.bar[0]}" y="${g.ys[0]}" width="${g.bar[1] - g.bar[0]}" height="${g.ys[5] - g.ys[0]}" fill="${C.bar}"/>`);
  }
  // números de cuerda
  const s1 = g.s1 || { x: 95.75, dy: 2 }, s6 = g.s6 || { x: 95.5, dy: 1.75 };
  out.push(`<text x="${s1.x}" y="${g.ys[0] + s1.dy}" class="sn">1</text>`);
  out.push(`<text x="${s6.x}" y="${g.ys[5] + s6.dy}" class="sn">6</text>`);
  // números romanos
  pos.labels.forEach((l, i) => out.push(`<text x="${l.x}" y="${g.ys[0] + l.dy}" class="rom" fill="${i === 0 ? C.text : C.label2}">${l.t}</text>`));
  // notas
  const edges = [g.left, ...g.frets];
  pos.notes.forEach(([s, f, finger]) => {
    const cell = f - pos.start; // 0..4
    const x = (edges[cell] + edges[cell + 1]) / 2 + 0.5;
    const y = g.ys[s - 1];
    out.push(marker(kindFor(page, s, f), x, y, finger, false));
  });
  return out.join('\n');
}

function neck(page) {
  const out = [];
  NECK.frets.forEach((y) => out.push(`<line x1="${NECK.xs[0]}" y1="${y}" x2="${NECK.xs[5]}" y2="${y}" stroke="${C.neckFret}" stroke-width="1"/>`));
  NECK.xs.forEach((x) => out.push(`<line x1="${x}" y1="${NECK.nut[0]}" x2="${x}" y2="${NECK.end}" stroke="${C.neckString}" stroke-width="1.1"/>`));
  out.push(`<rect x="${NECK.xs[0]}" y="${NECK.nut[0]}" width="${NECK.xs[5] - NECK.xs[0]}" height="${NECK.nut[1] - NECK.nut[0]}" fill="${C.nut}"/>`);
  NECK.xs.slice(1, 5).forEach((x) => out.push(`<line x1="${x}" y1="${NECK.nut[0]}" x2="${x}" y2="${NECK.nut[1]}" stroke="#9a9a9a" stroke-width="0.8"/>`));
  // etiquetas rotadas
  out.push(`<text transform="translate(865.5,269.2) rotate(90)" class="sn" font-size="15" text-anchor="middle" dominant-baseline="central">6</text>`);
  out.push(`<text transform="translate(1114,268.6) rotate(90)" class="sn" font-size="15" text-anchor="middle" dominant-baseline="central">1</text>`);
  [[2, 'II'], [5, 'V'], [7, 'VII'], [10, 'X'], [12, 'XII']].forEach(([f, t]) => {
    const y = [NECK.zero, ...NECK.frets][f - 1] + 1.5;
    out.push(`<text transform="translate(1122.3,${y}) rotate(90)" class="rom nr" dominant-baseline="central">${t}</text>`);
  });
  // notas: unión de todas las posiciones
  const seen = new Set();
  page.positions.forEach((p) => p.notes.forEach(([s, f]) => seen.add(`${s}:${f}`)));
  [...seen].forEach((k) => {
    const [s, f] = k.split(':').map(Number);
    out.push(marker(kindFor(page, s, f), NECK.xs[6 - s], neckCellY(f), null, true));
  });
  return out.join('\n');
}

function header(page) {
  const out = [];
  out.push(`<rect x="98.5" y="191.25" width="1046" height="36.75" fill="${C.header}"/>`);
  out.push(`<text transform="translate(107.3,217.2) scale(0.86,1)" class="title"><tspan font-weight="300">${esc(page.title[0])}</tspan> <tspan font-weight="700">${esc(page.title[1])}</tspan></text>`);
  // leyenda: cada ítem es un grupo; en las páginas nuevas se alinea a la derecha en runtime (ver script)
  const fixedX = [867.75, 1007.5];
  out.push(`<g class="legend"${page.legendFixed ? "" : " data-auto"}>`);
  page.legend.forEach((l, i) => {
    const x = fixedX[i];
    out.push(`<g class="li" transform="translate(${x},0)">`);
    if (l.kind === "major") {
      out.push(`<circle cx="13.25" cy="210.1" r="13.25" fill="${C.red}"/>`);
      out.push(`<text x="13.25" y="215.1" class="lx" fill="#fff">X</text>`);
      out.push(`<text x="31.6" y="216.3" class="lg" fill="${C.red}">${esc(l.text)}</text>`);
    } else {
      out.push(`<rect x="0.75" y="199.75" width="20.5" height="20.5" fill="none" stroke="${C.orange}" stroke-width="1.5"/>`);
      out.push(`<text x="11" y="215.1" class="lx" fill="${C.orange}">X</text>`);
      out.push(`<text x="30" y="216.3" class="lg" fill="${C.orange}">${esc(l.text)}</text>`);
    }
    out.push("</g>");
  });
  out.push("</g>");
  return out.join('\n');
}

function page(p) {
  return `<section class="page" id="${p.id}"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title.join(' '))}">
${header(p)}
${p.positions.map((pos, i) => diagram(p, i, pos)).join('\n')}
${neck(p)}
</svg></section>`;
}

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Modos griegos – Guitarra</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400&family=Oswald:wght@300;700&family=Questrial&display=block" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #d9d9d9; }
  .toolbar { position: sticky; top: 0; z-index: 2; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: center;
    padding: 10px 16px; background: #222; font: 14px/1.2 system-ui, sans-serif; }
  .toolbar a, .toolbar button { color: #fff; background: #3a3a3a; border: 0; border-radius: 4px; padding: 6px 10px; text-decoration: none; cursor: pointer; font: inherit; }
  .toolbar .pdf { background: ${C.red}; }
  .page { width: 210mm; height: 297mm; margin: 16px auto; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.25); overflow: hidden; }
  .page svg { display: block; width: 100%; height: 100%; }
  @media screen and (max-width: 840px) { .page { width: calc(100vw - 32px); height: calc((100vw - 32px) * 1.41428); } }
  @media print {
    html, body { background: #fff; }
    .toolbar { display: none; }
    .page { margin: 0; box-shadow: none; width: 210mm; height: 297mm; break-after: page; }
  }
  .num { font-family: ${F.num}; font-size: 15px; text-anchor: middle; fill: ${C.text}; }
  .dn { font-family: ${F.num}; font-size: 13px; text-anchor: middle; }
  .sn { font-family: ${F.num}; font-size: 13px; fill: ${C.text}; }
  .rom { font-family: ${F.num}; font-size: 19.5px; }
  .nr { font-size: 16.5px; fill: ${C.label2}; }
  .title { font-family: ${F.title}; font-size: 22.6px; fill: #111; }
  .lg { font-family: ${F.legend}; font-size: 13.4px; }
  .lx { font-family: ${F.legend}; font-size: 14px; text-anchor: middle; }
</style>
</head>
<body>
<nav class="toolbar">
${PAGES.map((p) => `<a href="#${p.id}">${esc(p.nav)}</a>`).join('\n')}
<a class="pdf" href="modos-griegos.pdf" download>Descargar PDF</a>
<button onclick="window.print()">Imprimir</button>
</nav>
${PAGES.map(page).join('\n')}
<script>
// Alinea la leyenda a la derecha de la barra (borde medido en el original: x = 1129.6).
document.fonts.ready.then(() => {
  document.querySelectorAll(".legend[data-auto]").forEach((lg) => {
    let right = 1129.6;
    [...lg.querySelectorAll(".li")].reverse().forEach((li) => {
      const t = li.querySelector(".lg");
      const w = t.getComputedTextLength() + Number(t.getAttribute("x"));
      const x = right - w;
      li.setAttribute("transform", "translate(" + x + ",0)");
      right = x - 15.8;
    });
  });
});
</script>
</body>
</html>
`;

writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html:', PAGES.length, 'páginas');
