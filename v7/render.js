// Dibuja la hoja (encabezado + 7 posiciones + mástil) con la misma geometría y estética de la v2.
// Unidades: píxeles a 150 dpi; 1 px del modelo JPEG = K px.
import { pcOf } from './theory.js';

export const K = 1240 / 769;
export const W = 1240;
export const H = Math.round(1280 * K);
const k = (v) => +(v * K).toFixed(2);

export const C = {
  red: '#CE3468', orange: '#EE9B3B', black: '#1E1E1E', header: '#EAEAEA', nut: '#7D7D7D', bar: '#3A3A3A',
  string: '#C2C2C2', fret: '#C8C8C8', neckString: '#B4B4B4', neckFret: '#D2D2D2', outline: '#B4B4B4',
  text: '#1E1E1E', label2: '#ADADAD',
};

const STRING_YS = [
  [117, 142, 167, 192.5, 218, 243],
  [277, 302.5, 328, 353, 378.5, 404],
  [439, 464.5, 490, 515, 540.5, 565.5],
  [604.5, 630, 655, 680.5, 705.5, 731],
  [775.5, 801, 826, 851.5, 877, 902],
  [950, 975, 1000, 1025.5, 1051, 1076],
  [1121, 1146, 1171.5, 1197, 1222, 1247.5],
].map((r) => r.map(k));
const FRETS = [153.5, 232, 309.5, 387, 464.5].map(k);
const LINE_END = k(487);
const BAR = [k(69), k(71.2)];
const NUT = [k(68), k(77)];
const NECK = {
  xs: [533, 563.5, 594, 624.5, 655, 685.5].map(k),
  nut: [k(113), k(124)],
  zero: k(121),
  frets: [168, 213, 260, 306.5, 353.5, 400.5, 447, 494, 541, 588, 634.5, 681.5, 728, 775, 822, 868.5, 914.5, 961, 1007, 1053.5].map(k),
  end: k(1076),
};
const HDR = { x: k(62), w: k(694.5) - k(62), y: k(70.75) - 18.4, h: 36.75 };
export const LEGEND_RIGHT = k(693);

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Recorte de cada posición y del mástil (para la vista ampliada)
export function boxOf(i) {
  if (i === 'neck') return [NECK.xs[0] - 30, NECK.nut[0] - 30, NECK.xs[5] - NECK.xs[0] + 75, NECK.end - NECK.nut[0] + 45];
  const ys = STRING_YS[i];
  return [k(52), ys[0] - k(26), LINE_END - k(52) + 10, ys[5] - ys[0] + k(40)];
}

function noteText(o, s, f, finger) {
  if (o.labelMode === 'finger') return finger ? String(finger) : '';
  const p = pcOf(s, f);
  return o.labelMode === 'note' ? o.names[p] : o.label(p) || '';
}

function marker(o, s, f, finger, x, y, big) {
  const p = pcOf(s, f);
  const tonic = p === o.tonicPc;
  // notas marcadas (blue note, nota mixolidia, alteraciones de las menores): mismo dibujo que la tónica, con su color
  const mark = !tonic && o.marks?.get(p);
  const txt = big ? (o.labelMode === 'finger' ? '' : noteText(o, s, f, finger)) : noteText(o, s, f, finger);
  const long = txt.length > 2;
  const out = [`<g class="n${tonic ? ' t' : mark ? ' mk' : ''}" data-k="${s}:${f}">`, `<circle class="ring" cx="${x}" cy="${y}" r="${big ? 20 : 18.5}"/>`];
  if (tonic || mark) {
    out.push(`<circle class="m" cx="${x}" cy="${y}" r="${big ? 15.2 : 14.3}" fill="${tonic ? o.tonicColor : mark}"/>`);
    if (txt) out.push(`<text x="${x}" y="${y + 4.6}" class="dn${long ? ' sm' : ''}" fill="#fff">${esc(txt)}</text>`);
  } else if (big) {
    out.push(`<circle class="m" cx="${x}" cy="${y}" r="15.4" fill="#fff" stroke="${C.outline}" stroke-width="1.2"/>`);
    if (txt) out.push(`<text x="${x}" y="${y + 4.6}" class="dn${long ? ' sm' : ''}" fill="${C.text}">${esc(txt)}</text>`);
  } else {
    const w = long ? 31 : 23;
    out.push(`<rect class="m" x="${x - w / 2}" y="${y - 6}" width="${w}" height="12" fill="#fff"/>`);
    out.push(`<text x="${x}" y="${y + 5.2}" class="num${long ? ' sm' : ''}">${esc(txt)}</text>`);
  }
  out.push('</g>');
  return out.join('');
}

function diagram(o, d, pos) {
  const ys = STRING_YS[d];
  const nut = pos.start === 1;
  const left = nut ? NUT[1] : BAR[1];
  const out = [`<g class="pos" data-i="${d}">`];
  const [bx, by, bw, bh] = boxOf(d);
  out.push(`<rect class="hit" x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="transparent"/>`);
  ys.forEach((y) => out.push(`<line x1="${left}" y1="${y}" x2="${LINE_END}" y2="${y}" stroke="${C.string}" stroke-width="1"/>`));
  FRETS.forEach((x) => out.push(`<line x1="${x}" y1="${ys[0]}" x2="${x}" y2="${ys[5]}" stroke="${C.fret}" stroke-width="1"/>`));
  if (nut) {
    out.push(`<rect x="${NUT[0]}" y="${ys[0]}" width="${NUT[1] - NUT[0]}" height="${ys[5] - ys[0]}" fill="${C.nut}"/>`);
    ys.slice(1, 5).forEach((y) => out.push(`<line x1="${NUT[0]}" y1="${y}" x2="${NUT[1]}" y2="${y}" stroke="#9a9a9a" stroke-width="0.8"/>`));
  } else {
    out.push(`<rect x="${BAR[0]}" y="${ys[0]}" width="${BAR[1] - BAR[0]}" height="${ys[5] - ys[0]}" fill="${C.bar}"/>`);
  }
  out.push(`<text x="${nut ? 98.5 : 96.5}" y="${ys[0] + (nut ? -4 : 1.6)}" class="sn">1</text>`);
  out.push(`<text x="${nut ? 98.75 : 96.5}" y="${ys[5] + (nut ? -0.75 : 1.75)}" class="sn">6</text>`);
  out.push(`<text x="${k(nut ? 77.5 : 75.5)}" y="${ys[0] - k(8.5)}" class="rom" fill="${C.text}">${ROMAN[pos.start]}</text>`);
  if (nut) out.push(`<text x="${FRETS[3] + 1}" y="${ys[0] - k(7.5)}" class="rom" fill="${C.label2}">V</text>`);
  const edges = [left, ...FRETS];
  pos.notes.forEach(([s, f, finger]) => {
    const cell = f - pos.start;
    out.push(marker(o, s, f, finger, (edges[cell] + edges[cell + 1]) / 2 + 0.5, ys[s - 1], false));
  });
  out.push('</g>');
  return out.join('\n');
}

const neckCellY = (f) => {
  const all = [NECK.zero, ...NECK.frets];
  return (all[f - 1] + all[f]) / 2 + 2.6;
};

function neck(o) {
  const out = ['<g class="neck" data-i="neck">'];
  const [bx, by, bw, bh] = boxOf('neck');
  out.push(`<rect class="hit" x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="transparent"/>`);
  NECK.frets.forEach((y) => out.push(`<line x1="${NECK.xs[0]}" y1="${y}" x2="${NECK.xs[5]}" y2="${y}" stroke="${C.neckFret}" stroke-width="1"/>`));
  NECK.xs.forEach((x) => out.push(`<line x1="${x}" y1="${NECK.nut[0]}" x2="${x}" y2="${NECK.end}" stroke="${C.neckString}" stroke-width="1.1"/>`));
  out.push(`<rect x="${NECK.xs[0]}" y="${NECK.nut[0]}" width="${NECK.xs[5] - NECK.xs[0]}" height="${NECK.nut[1] - NECK.nut[0]}" fill="${C.nut}"/>`);
  NECK.xs.slice(1, 5).forEach((x) => out.push(`<line x1="${x}" y1="${NECK.nut[0]}" x2="${x}" y2="${NECK.nut[1]}" stroke="#9a9a9a" stroke-width="0.8"/>`));
  out.push(`<text transform="translate(${NECK.xs[0] + 7},${k(108)}) rotate(90)" class="sn" font-size="15" text-anchor="middle" dominant-baseline="central">6</text>`);
  out.push(`<text transform="translate(${NECK.xs[5] + 8.6},${k(108)}) rotate(90)" class="sn" font-size="15" text-anchor="middle" dominant-baseline="central">1</text>`);
  [[2, 'II'], [5, 'V'], [7, 'VII'], [10, 'X'], [12, 'XII'], [15, 'XV'], [17, 'XVII']].forEach(([f, t]) => {
    const y = [NECK.zero, ...NECK.frets][f - 1] + 1.5;
    out.push(`<text transform="translate(${NECK.xs[5] + 18.4},${y}) rotate(90)" class="rom nr" dominant-baseline="central">${t}</text>`);
  });
  const seen = new Map();
  o.positions.forEach((p) => p.notes.forEach(([s, f, fg]) => seen.has(`${s}:${f}`) || seen.set(`${s}:${f}`, [s, f, fg])));
  seen.forEach(([s, f, fg]) => out.push(marker(o, s, f, fg, NECK.xs[6 - s], neckCellY(f), true)));
  out.push('</g>');
  return out.join('\n');
}

function header(o) {
  const cy = HDR.y + 18.85;
  const out = [];
  out.push(`<rect x="${HDR.x}" y="${HDR.y}" width="${HDR.w}" height="${HDR.h}" fill="${C.header}"/>`);
  out.push(`<text transform="translate(${k(68) - 0.5},${HDR.y + 25.95}) scale(0.86,1)" class="title"><tspan font-weight="300">${esc(o.title[0])}</tspan> <tspan font-weight="700">${esc(o.title[1])}</tspan></text>`);
  out.push('<g class="legend">');
  o.legend.forEach((l) => {
    out.push('<g class="li">');
    out.push(`<circle cx="13.25" cy="${cy}" r="13.25" fill="${l.color}"/>`);
    out.push(`<text x="13.25" y="${cy + 5}" class="lx" fill="#fff">X</text>`);
    out.push(`<text x="31.6" y="${cy + 6.2}" class="lg" fill="${l.color}">${esc(l.text)}</text>`);
    out.push('</g>');
  });
  out.push('</g>');
  return out.join('\n');
}

export function sheetSvg(o) {
  return `<svg class="sheet" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(o.title.join(' '))}">
${header(o)}
${o.positions.map((pos, i) => diagram(o, i, pos)).join('\n')}
${o.showNeck ? neck(o) : ''}
</svg>`;
}

// Alinea la leyenda a la derecha (necesita las fuentes cargadas).
export function layoutLegend(svg) {
  svg.querySelectorAll('.legend').forEach((lg) => {
    let right = LEGEND_RIGHT;
    [...lg.querySelectorAll('.li')].reverse().forEach((li) => {
      const t = li.querySelector('.lg');
      const x = right - (t.getComputedTextLength() + Number(t.getAttribute('x')));
      li.setAttribute('transform', `translate(${x},0)`);
      right = x - 15.8;
    });
  });
}
