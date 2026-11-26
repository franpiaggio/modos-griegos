// Ubicar notas en la guitarra: posiciones, una cuerda, terceras por cuerdas y formas de intervalos.
// Todo devuelve el SVG de viz.fretboard con los nombres de las cuerdas en la notación elegida.
import { OPEN_MIDI, note, noteName, notePc, transpose, intervalBetween, ivSemis, spellAll } from './theory.js';
import { prefs } from './ui.js';
import * as V from './viz.js';

const mod = (n, m = 12) => ((n % m) + m) % m;
const nn = (n) => noteName(n, prefs.notation);
// 1ra a 6ta: Mi Si Sol Re La Mi
const STRING_NOTES = [note(2), note(6), note(4), note(1), note(5), note(2)];
export const stringNames = () => STRING_NOTES.map(nn);
export const midiAt = (s, f) => OPEN_MIDI[s] + f;
export const fretOf = (pc, s, min = 0) => { let f = mod(pc - OPEN_MIDI[s]); while (f < min) f += 12; return f; };

// Color de cada nota: por rol en el acorde (1 3 5 7 tensión) o tónica negra y el resto gris
export const roleColor = (iv) => V.ROLE[V.roleOf(iv)];
const GREY = '#6b6b75';
export const ORANGE = '#E07A1F';

// Cuerda y traste de la tónica para una posición cómoda (raíz en 6ta o 5ta, entre los trastes 2 y 10)
export function rootSpot(pc, prefer = null) {
  const opts = [6, 5].map((s) => ({ s, f: fretOf(pc, s, 2) })).filter((o) => o.f <= 11);
  if (prefer) { const p = opts.find((o) => o.s === prefer); if (p) return p; }
  return opts.sort((a, b) => Math.abs(a.f - 6) - Math.abs(b.f - 6))[0] || { s: 6, f: fretOf(pc, 6, 1) };
}

// Posición de una escala o arpeggio: ventana de 5 trastes desde un traste antes de la tónica,
// de la 6ta a la 1ra cuerda, sin repetir alturas (como se toca una posición).
// items: [{ pc, iv, name }] ; devuelve marks para fretboard
// lo: primer traste de la ventana (para comparar dos escalas o acordes en exactamente la misma zona)
export function positionMarks(root, ivs, { spot = null, color = null, label = 'name', mark = [], lo: lo0 = null } = {}) {
  const rpc = notePc(root);
  const sp = spot || rootSpot(rpc);
  const lo = lo0 ?? Math.max(0, sp.f - 1), hi = lo + 4;
  const byPc = new Map(ivs.map((iv) => [mod(rpc + ivSemis(iv)), iv]));
  const marks = [];
  let last = -1;
  for (let s = 6; s >= 1; s--) {
    for (let f = lo; f <= hi; f++) {
      const m = midiAt(s, f);
      const iv = byPc.get(mod(m));
      if (iv === undefined || m <= last) continue;
      if (s === sp.s && f < sp.f && m < midiAt(sp.s, sp.f) - 12) continue;
      last = m;
      const n = transpose(root, iv);
      marks.push({ s, f, iv, label: label === 'iv' ? iv : label === 'none' ? '' : nn(n), color: color ? color(iv) : iv === '1' ? V.ROLE[1] : mark.includes(iv) ? ORANGE : GREY });
    }
  }
  return marks;
}
export function position(root, ivs, opts = {}) {
  const marks = positionMarks(root, ivs, opts);
  const from = opts.lo != null ? Math.max(0, opts.lo - 1) : Math.max(0, (opts.spot || rootSpot(notePc(root))).f - 2);
  return V.fretboard(marks, { names: stringNames(), label: opts.title || `${nn(root)} en el mástil`, from: from || undefined, to: opts.lo != null ? opts.lo + 4 : undefined });
}

// Las notas en una sola cuerda: cada traste es un semitono
// inOctave: cada nota en su lugar dentro de la octava (las 9, 11 y 13 van sobre la 2, 4 y 6)
export function oneString(root, ivs, { s = 5, startFret = null, color = null, label = 'name', mark = [], title = '', inOctave = false } = {}) {
  const f0 = startFret ?? fretOf(notePc(root), s, 1);
  const marks = [];
  let prev = -1;
  ivs.forEach((iv) => {
    let f = f0 + mod(ivSemis(iv));
    if (iv === '8') f = f0 + 12;
    if (!inOctave) while (f <= prev) f += 12;
    prev = f;
    const n = transpose(root, iv === '8' ? '1' : iv);
    marks.push({ s, f, iv, label: label === 'iv' ? iv : nn(n), color: color ? color(iv) : iv === '1' || iv === '8' ? V.ROLE[1] : mark.includes(iv) ? ORANGE : GREY });
  });
  const lines = marks.length === 2 ? [[0, 1, '#9a9aa3']] : [];
  return V.fretboard(marks, { names: stringNames(), label: title || `${nn(root)} en la ${s}ta cuerda`, from: Math.max(0, f0 - 1), lines });
}

// Acorde por terceras, una nota por cuerda desde la 6ta (o la cuerda pedida) hacia las agudas
export function stackMarks(root, ivs, { s0 = 6, f0 = null, label = 'name' } = {}) {
  let s = s0;
  let prev = midiAt(s0, f0 ?? fretOf(notePc(root), s0, 1));
  const marks = [{ s, f: prev - OPEN_MIDI[s], iv: ivs[0], label: label === 'iv' ? ivs[0] : nn(root), color: roleColor(ivs[0]) }];
  ivs.slice(1).forEach((iv) => {
    const n = transpose(root, iv);
    let m = prev; do m++; while (mod(m) !== notePc(n));
    s -= 1;
    if (s < 1) return;
    let f = m - OPEN_MIDI[s];
    if (f < 0) { s += 1; f = m - OPEN_MIDI[s]; }
    prev = m;
    marks.push({ s, f, iv, label: label === 'iv' ? iv : nn(n), color: roleColor(iv) });
  });
  return marks;
}
export function stacked(root, ivs, opts = {}) {
  return V.fretboard(stackMarks(root, ivs, opts), { names: stringNames(), label: opts.title || `${nn(root)} por terceras en el mástil`, from: opts.from, to: opts.to });
}

// Forma de un intervalo desde una tónica: en la misma cuerda y pasando a la cuerda siguiente
export function intervalShape(root, iv, { s = 5, f = null, title = '' } = {}) {
  const f0 = f ?? fretOf(notePc(root), s, 1);
  const semis = iv === '8' ? 12 : mod(ivSemis(iv)) || 12;
  const top = transpose(root, iv === '8' ? '1' : iv);
  const a = { s, f: f0, label: nn(root), color: V.ROLE[1] };
  const marks = [a, { s, f: f0 + semis, label: nn(top), color: ORANGE, ring: true }];
  // la cuerda siguiente (más aguda) está 5 semitonos arriba, salvo de la 3ra a la 2da (4)
  const up = s - 1;
  const gap = s === 3 ? 4 : 5;
  const f2 = f0 + semis - gap;
  if (up >= 1 && f2 >= 0) marks.push({ s: up, f: f2, label: nn(top), color: ORANGE });
  const lines = [[0, 1, '#c9c2b6']];
  if (marks[2]) lines.push([0, 2, ORANGE]);
  return V.fretboard(marks, { names: stringNames(), label: title || `${nn(root)}–${nn(top)} en el mástil`, lines, from: Math.max(0, Math.min(f0, f2 >= 0 ? f2 : f0) - 1) });
}

// Mapa de intervalos alrededor de una tónica: cada traste cercano con su intervalo
const IV12 = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
export function intervalMap(root, { s = 6, f = null, only = null, title = '' } = {}) {
  const f0 = f ?? fretOf(notePc(root), s, 3);
  const lo = Math.max(1, f0 - 2), hi = f0 + 3;
  const r = midiAt(s, f0);
  const marks = [];
  for (let st = 6; st >= 1; st--) {
    for (let fr = lo; fr <= hi; fr++) {
      const d = midiAt(st, fr) - r;
      if (d < 0 || d > 14) continue;
      const iv = d === 12 ? '8' : d === 13 ? 'b9' : d === 14 ? '9' : IV12[d];
      if (only && !only.includes(iv)) continue;
      marks.push({ s: st, f: fr, label: iv, color: d % 12 === 0 ? V.ROLE[1] : roleColor(iv === 'b5' ? '#4' : iv) });
    }
  }
  return V.fretboard(marks, { names: stringNames(), label: title || `Intervalos desde ${nn(root)} en el mástil`, from: lo - 1, to: hi });
}

// Marcas libres con nombres de cuerda
export const neck = (marks, opts = {}) => V.fretboard(marks, { names: stringNames(), ...opts });

// Respuesta de un ejercicio en el mástil: notas escritas (la primera es la tónica). chordish: colores por rol.
export function answerNeck(notes, { chordish = false } = {}) {
  const root = notes[0];
  const ivs = notes.map((n) => { const b = intervalBetween(root, n); return b.id === '1J' || b.deg === 1 ? '1' : formulaOf(b); });
  if (notes.length === 2) {
    // la tónica en la cuerda donde quede más grave (así el intervalo no pasa del traste 17)
    const sp = [5, 6, 4].map((s) => ({ s, f: fretOf(notePc(root), s, 1) })).sort((a, b) => a.f - b.f)[0];
    return intervalShape(root, ivs[1], sp);
  }
  const color = chordish ? (iv) => roleColor(iv.replace(/^(b|#)?(2)$/, '$19').replace(/^(b|#)?(4)$/, '$111').replace(/^(b|#)?(6)$/, '$113')) : null;
  return position(root, ivs, { color });
}
// '3M' -> '3', '3m' -> 'b3', '4A' -> '#4', '5d' -> 'b5', '7m' -> 'b7' ...
function formulaOf(b) {
  const d = b.deg, q = b.id.replace(/^\d+/, '');
  const perfect = [1, 4, 5, 8].includes(d);
  let acc = '';
  if (perfect) acc = q === 'A' ? '#' : q === 'd' ? 'b' : '';
  else acc = q === 'm' ? 'b' : q === 'A' ? '#' : q === 'd' ? 'bb' : '';
  return acc + (d === 8 ? 1 : d);
}

// Acorde (arpegio) en una posición, con colores por rol
export const chordNeck = (root, chord, opts = {}) => position(root, chord.intervals, { color: roleColor, ...opts, title: opts.title || `${nn(root)}${chord.sym} en el mástil` });

// Escala sobre un acorde: notas del acorde por rol, tensiones en violeta y notas a evitar en gris claro
export function scaleOnChord(root, scale, chord, avoid = [], opts = {}) {
  const tones = new Set(chord.intervals.map((iv) => mod(ivSemis(iv))));
  const color = (iv) => (tones.has(mod(ivSemis(iv))) ? roleColor(chord.intervals.find((x) => mod(ivSemis(x)) === mod(ivSemis(iv)))) : avoid.some((a) => mod(ivSemis(a)) === mod(ivSemis(iv))) ? V.ROLE.x : V.ROLE.t);
  return position(root, scale.intervals, { color, label: 'iv', title: `${nn(root)} ${scale.name} sobre ${nn(root)}${chord.sym}`, lo: opts.lo });
}

// Dos acordes en la misma zona: el primero relleno (por rol) y el segundo en contorno.
// Sirve para resoluciones (V7 → I) y superposiciones (arpegio sobre un acorde, con su aporte como etiqueta).
// guides: [[intervalo en A, intervalo en B]]: une cada nota guía con la nota más cercana a la que resuelve.
export function overlay(rootA, ivsA, rootB, ivsB, { labelB = null, colorB = null, title = '', guides = [], lo: lo0 = null } = {}) {
  const sp = rootSpot(notePc(rootA));
  const lo = lo0 ?? Math.max(0, sp.f - 1), hi = lo + 4;
  const marks = positionMarks(rootA, ivsA, { spot: sp, color: roleColor, lo });
  const taken = new Set(marks.map((m) => `${m.s}-${m.f}`));
  const bpc = new Map(ivsB.map((iv, i) => [mod(notePc(rootB) + ivSemis(iv)), i]));
  const aPcs = new Set(ivsA.map((iv) => mod(notePc(rootA) + ivSemis(iv))));
  for (let s = 6; s >= 1; s--) {
    for (let f = lo; f <= hi; f++) {
      const i = bpc.get(mod(midiAt(s, f)));
      if (i === undefined) continue;
      const key = `${s}-${f}`;
      const lab = labelB ? labelB[i] : nn(transpose(rootB, ivsB[i]));
      if (taken.has(key)) { const m = marks.find((x) => `${x.s}-${x.f}` === key); m.label = labelB ? lab : m.label; m.ivB = ivsB[i]; continue; }
      // una nota que ya está en el primer acorde (en otra cuerda) no se repite: el contorno marca solo lo nuevo
      if (aPcs.has(mod(midiAt(s, f)))) continue;
      marks.push({ s, f, ring: true, label: lab, color: colorB || roleColor(ivsB[i]), ivB: ivsB[i] });
    }
  }
  const lines = [];
  guides.forEach(([ia, ib]) => {
    let best = null;
    marks.forEach((a, i) => {
      if (a.ring || a.iv !== ia) return;
      marks.forEach((b, j) => {
        if (b.ivB !== ib || i === j) return;
        const d = Math.abs(a.s - b.s) * 1.6 + Math.abs(a.f - b.f);
        if (!best || d < best.d) best = { i, j, d };
      });
    });
    if (best) lines.push([best.i, best.j, roleColor(ia)]);
  });
  return V.fretboard(marks, { names: stringNames(), label: title || 'Dos acordes en la misma zona del mástil', from: Math.max(0, lo - 1) || undefined, to: hi, lines });
}

// V7 y su sustituto tritonal en forma "shell" (fundamental, 7ma y 3ra): comparten las dos notas de arriba
export function tritoneNeck(dom, sub) {
  const f = fretOf(notePc(dom), 6, 1);
  const n3 = transpose(dom, '3'), n7 = transpose(dom, 'b7');
  const marks = [
    { s: 6, f, label: nn(dom), color: V.ROLE[1] },
    { s: 5, f: f + 1, label: nn(sub), color: V.ROLE.t, ring: true },
    { s: 4, f, label: nn(n7), color: V.ROLE[7] },
    { s: 3, f: f + 1, label: nn(n3), color: V.ROLE[3] },
  ];
  return V.fretboard(marks, { names: stringNames(), label: `${nn(dom)}7 y ${nn(sub)}7 en el mástil`, lines: [[2, 3, '#8E4CC0']] });
}

// Fundamentales de varios acordes (grados) en la zona de una tónica: [{ iv, label, color }]
export function rootsNeck(key, items, { title = '' } = {}) {
  const sp = rootSpot(notePc(key), 6);
  const marks = [];
  items.forEach((it) => {
    const pc = mod(notePc(key) + ivSemis(it.iv));
    // la fundamental en la 6ta o la 5ta cuerda, lo más cerca de la tónica (como se arman los acordes con cejilla)
    const cands = [6, 5, 4].map((s) => ({ s, f: fretOf(pc, s, Math.max(1, sp.f - 1)) })).filter((c) => c.f <= sp.f + 4);
    const c = cands[0] || { s: 5, f: fretOf(pc, 5, 1) };
    marks.push({ ...c, label: it.label, color: it.color || V.ROLE[1] });
  });
  return V.fretboard(marks, { names: stringNames(), label: title || 'Fundamentales en el mástil', from: Math.max(0, sp.f - 2) });
}
