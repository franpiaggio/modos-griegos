// Formación de acordes: formas CAGED, tríadas por grupos de cuerdas y voicings drop 2 / drop 3.
// Un voicing es { notes: [{ s, f, iv, finger? }], muted: [cuerdas], name }.
import { OPEN_MIDI, ivSemis, chordById } from './theory.js';

const mod = (n, m = 12) => ((n % m) + m) % m;
const OPEN_PC = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };

// ---------------------------------------------------------------- CAGED
// [cuerda, traste relativo a la cejilla (0 = cejilla o cuerda al aire), intervalo, dedo con cejilla]
// Al aire (cejilla en el traste 0) el dedo es el de la cejilla menos 1 (C, A, G, E, D abiertos).
const CAGED = {
  mayor: {
    C: { root: 0, notes: [[5, 3, '1', 4], [4, 2, '3', 3], [3, 0, '5', 1], [2, 1, '1', 2], [1, 0, '3', 1]] },
    A: { root: 9, notes: [[5, 0, '1', 1], [4, 2, '5', 2], [3, 2, '1', 3], [2, 2, '3', 4], [1, 0, '5', 1]] },
    G: { root: 7, notes: [[6, 3, '1', 3], [5, 2, '3', 2], [4, 0, '5', 1], [3, 0, '1', 1], [2, 0, '3', 1], [1, 3, '1', 4]] },
    E: { root: 4, notes: [[6, 0, '1', 1], [5, 2, '5', 3], [4, 2, '1', 4], [3, 1, '3', 2], [2, 0, '5', 1], [1, 0, '1', 1]] },
    D: { root: 2, notes: [[4, 0, '1', 1], [3, 2, '5', 2], [2, 3, '1', 4], [1, 2, '3', 3]] },
  },
  menor: {
    C: { root: 0, notes: [[5, 3, '1', 4], [4, 1, 'b3', 2], [3, 0, '5', 1], [2, 1, '1', 3]] },
    A: { root: 9, notes: [[5, 0, '1', 1], [4, 2, '5', 3], [3, 2, '1', 4], [2, 1, 'b3', 2], [1, 0, '5', 1]] },
    G: { root: 7, notes: [[6, 3, '1', 3], [5, 1, 'b3', 2], [4, 0, '5', 1], [3, 0, '1', 1], [2, 3, '5', 4]] },
    E: { root: 4, notes: [[6, 0, '1', 1], [5, 2, '5', 3], [4, 2, '1', 4], [3, 0, 'b3', 1], [2, 0, '5', 1], [1, 0, '1', 1]] },
    D: { root: 2, notes: [[4, 0, '1', 1], [3, 2, '5', 3], [2, 3, '1', 4], [1, 1, 'b3', 2]] },
  },
  '7': {
    E: { root: 4, notes: [[6, 0, '1', 1], [5, 2, '5', 3], [4, 0, 'b7', 1], [3, 1, '3', 2], [2, 0, '5', 1], [1, 0, '1', 1]] },
    A: { root: 9, notes: [[5, 0, '1', 1], [4, 2, '5', 3], [3, 0, 'b7', 1], [2, 2, '3', 4], [1, 0, '5', 1]] },
  },
  maj7: {
    E: { root: 4, notes: [[6, 0, '1', 1], [4, 1, '7', 3], [3, 1, '3', 4], [2, 0, '5', 2]] },
    A: { root: 9, notes: [[5, 0, '1', 1], [4, 2, '5', 3], [3, 1, '7', 2], [2, 2, '3', 4], [1, 0, '5', 1]] },
  },
  m7: {
    E: { root: 4, notes: [[6, 0, '1', 1], [5, 2, '5', 3], [4, 0, 'b7', 1], [3, 0, 'b3', 1], [2, 0, '5', 1], [1, 0, '1', 1]] },
    A: { root: 9, notes: [[5, 0, '1', 1], [4, 2, '5', 3], [3, 0, 'b7', 1], [2, 1, 'b3', 2], [1, 0, '5', 1]] },
  },
};
export const CAGED_TYPES = [['mayor', 'Mayor'], ['menor', 'Menor'], ['7', '7'], ['maj7', 'maj7'], ['m7', 'm7']];
export const CAGED_ORDER = ['C', 'A', 'G', 'E', 'D'];

// Formas CAGED de un acorde en la tónica pedida, ordenadas por posición en el mástil.
export function cagedShapes(type, rootPc) {
  const forms = CAGED[type];
  return CAGED_ORDER.filter((k) => forms[k]).map((k) => {
    const sh = forms[k];
    const base = mod(rootPc - sh.root);
    const notes = sh.notes.map(([s, rf, iv, fg]) => {
      const f = rf + base;
      return { s, f, iv, finger: base === 0 ? (rf === 0 ? 0 : fg - 1) : fg };
    });
    const used = new Set(notes.map((n) => n.s));
    return { form: k, base, notes, muted: [1, 2, 3, 4, 5, 6].filter((s) => !used.has(s)), barre: base > 0 ? barreOf(notes, base) : null };
  }).sort((a, b) => a.base - b.base);
}
// Cejilla: cuerdas tocadas con el dedo 1 en el traste de la cejilla (si son 2 o más)
function barreOf(notes, base) {
  const ss = notes.filter((n) => n.f === base && n.finger === 1).map((n) => n.s);
  return ss.length >= 2 ? { f: base, from: Math.min(...ss), to: Math.max(...ss) } : null;
}

// ---------------------------------------------------------------- voicings cerrados por grupo de cuerdas
// order: intervalos de grave a agudo; cada nota es la más cercana por arriba de la anterior.
// Busca la posición más baja del mástil (trastes 0..15) que sea tocable (apertura máx. 4 trastes; con cuerdas al aire, todo dentro de los primeros 4).
function place(strings, order, rootPc, maxSpan = 4) {
  for (let f0 = 0; f0 <= 15; f0++) {
    const s0 = strings[0];
    if (mod(OPEN_PC[s0] + f0) !== mod(rootPc + ivSemis(order[0]))) continue;
    let prev = OPEN_MIDI[s0] + f0;
    const notes = [{ s: s0, f: f0, iv: order[0] }];
    let ok = true;
    for (let i = 1; i < order.length; i++) {
      const s = strings[i];
      const pc = mod(rootPc + ivSemis(order[i]));
      let m = prev + 1;
      while (mod(m) !== pc) m++;
      const f = m - OPEN_MIDI[s];
      if (f < 0 || f > 17) { ok = false; break; }
      notes.push({ s, f, iv: order[i] });
      prev = m;
    }
    if (!ok) continue;
    const fr = notes.map((n) => n.f);
    const fretted = fr.filter((x) => x > 0);
    const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
    if (span > maxSpan - 1) continue;
    if (fr.includes(0) && Math.max(...fr) > 4) continue;
    const used = new Set(strings);
    return { notes, muted: [1, 2, 3, 4, 5, 6].filter((s) => !used.has(s)) };
  }
  return null;
}

export const TRIAD_TYPES = [['mayor', 'Mayor'], ['menor', 'Menor'], ['dim', 'Disminuida'], ['aum', 'Aumentada']];
export const TRIAD_SETS = [[3, 2, 1], [4, 3, 2], [5, 4, 3], [6, 5, 4]]; // de grave a agudo
export const INV_NAMES = ['Fundamental', '1ra inversión', '2da inversión', '3ra inversión'];

export function triadVoicings(type, rootPc, set) {
  const tones = chordById(type).intervals; // 1 3 5
  return [0, 1, 2].map((inv) => {
    const order = [0, 1, 2].map((k) => tones[(inv + k) % 3]);
    const v = place(set, order, rootPc, 5);
    return v && { ...v, inv, name: INV_NAMES[inv] };
  }).filter(Boolean);
}

export const SEVENTH_TYPES = [['maj7', 'maj7'], ['7', '7'], ['m7', 'm7'], ['m7b5', 'm7(b5)'], ['dim7', '°7'], ['mMaj7', 'm(maj7)']];
export const DROP2_SETS = [[4, 3, 2, 1], [5, 4, 3, 2], [6, 5, 4, 3]];
export const DROP3_SETS = [[6, 4, 3, 2], [5, 3, 2, 1]];

// Drop 2: del voicing cerrado (de grave a agudo v0 v1 v2 v3) baja una octava la 2da voz desde arriba (v2) -> v2 v0 v1 v3.
// Drop 3: baja la 3ra voz desde arriba (v1) -> v1 v0 v2 v3. Las inversiones se nombran por la nota del bajo.
export function dropVoicings(type, rootPc, set, drop = 2) {
  const t = chordById(type).intervals; // 1 3 5 7
  return [0, 1, 2, 3].map((inv) => {
    // bajo = t[inv]
    const k = drop === 2 ? mod(inv - 2, 4) : mod(inv - 1, 4);
    const v = [0, 1, 2, 3].map((i) => t[(k + i) % 4]);
    const order = drop === 2 ? [v[2], v[0], v[1], v[3]] : [v[1], v[0], v[2], v[3]];
    const r = place(set, order, rootPc, 5);
    return r && { ...r, inv, name: INV_NAMES[inv] };
  }).filter(Boolean);
}

export const midiOfNote = (n) => OPEN_MIDI[n.s] + n.f;

// ---------------------------------------------------------------- diagrama de acorde (SVG vertical)
// labels: (nota) => texto dentro del punto
export function chordBox(v, { labels, title = '', sub = '', tonicIv = '1', w = 132 } = {}) {
  const fr = v.notes.map((n) => n.f);
  const fretted = fr.filter((x) => x > 0);
  const maxF = Math.max(0, ...fr);
  const minF = fretted.length ? Math.min(...fretted) : 1;
  const fromNut = maxF <= 4;
  const first = fromNut ? 1 : minF;
  const rows = Math.max(4, (fromNut ? maxF : maxF - minF + 1));
  const pad = { l: 30, r: 12, t: 40, b: 20 };
  const gx = (w - pad.l - pad.r) / 5;
  const gy = 26;
  const h = pad.t + rows * gy + pad.b;
  const x = (s) => pad.l + (6 - s) * gx;
  const y = (f) => pad.t + (f - first + 0.5) * gy;
  const out = [`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="cbox" role="img" aria-label="${title} ${sub}">`];
  for (let i = 0; i <= rows; i++) out.push(`<line x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + i * gy}" y2="${pad.t + i * gy}" class="cb-fret"/>`);
  for (let s = 1; s <= 6; s++) out.push(`<line x1="${x(s)}" x2="${x(s)}" y1="${pad.t}" y2="${pad.t + rows * gy}" class="cb-str"/>`);
  if (fromNut) out.push(`<rect x="${pad.l - 1}" y="${pad.t - 4}" width="${w - pad.l - pad.r + 2}" height="5" class="cb-nut"/>`);
  else out.push(`<text x="${pad.l - 13}" y="${pad.t + 0.5 * gy + 4}" class="cb-fn" text-anchor="end">${first}</text>`);
  // X y O
  v.muted.forEach((s) => out.push(`<text x="${x(s)}" y="${pad.t - 10}" class="cb-xo" text-anchor="middle">×</text>`));
  v.notes.filter((n) => n.f === 0).forEach((n) => out.push(`<circle cx="${x(n.s)}" cy="${pad.t - 14}" r="4.5" class="cb-open"/>`));
  if (v.barre) out.push(`<rect x="${x(v.barre.to) - 10}" y="${y(v.barre.f) - 10}" width="${x(v.barre.from) - x(v.barre.to) + 20}" height="20" rx="10" class="cb-barre"/>`);
  v.notes.filter((n) => n.f > 0).forEach((n) => {
    const t = labels(n);
    const tonic = n.iv === tonicIv;
    out.push(`<g class="cb-n${tonic ? ' t' : ''}"><circle cx="${x(n.s)}" cy="${y(n.f)}" r="10"/>`);
    if (t !== '') out.push(`<text x="${x(n.s)}" y="${y(n.f) + 4}" text-anchor="middle" class="${String(t).length > 2 ? 'sm' : ''}">${t}</text>`);
    out.push('</g>');
  });
  // las cuerdas al aire muestran su etiqueta debajo del diagrama
  v.notes.filter((n) => n.f === 0).forEach((n) => { const t = labels(n, true); if (t !== '') out.push(`<text x="${x(n.s)}" y="${h - 3}" text-anchor="middle" class="cb-ol">${t}</text>`); });
  out.push('</svg>');
  return out.join('');
}
