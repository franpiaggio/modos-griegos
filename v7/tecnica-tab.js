// Tablatura mínima: texto -> eventos -> SVG.
// Tokens (separados por espacios):
//   6-5        cuerda 6, traste 5            6-X   nota muerta (apagada)
//   6-5D 6-5U  púa abajo / arriba            6-5p 6-5i 6-5m 6-5a  dedos de mano derecha
//   h1-7       ligado ascendente (hammer)    p1-5  ligado descendente (pull-off)
//   /3-7 \3-5  deslizar hacia arriba/abajo  b2-8(10)  bend hasta la altura del traste 10
//   2-8~       vibrato                        [6-0,5-2]D  acorde (doble cuerda)
//   |          barra de compás                !texto  indicación arriba (pp, ff, PM...)
//   @2         subdivisión desde acá (1 negra, 2 corcheas, 3 tresillos, 4 semicorcheas)
import { OPEN_MIDI } from './theory.js';

const NOTE = /^([hp/\\b]?)(\d)-(\d+|X)(?:\((\d+)\))?(~?)([DUpima]?)$/;

export function parseTab(src) {
  const ev = [];
  let ann = null;
  let sub = null;
  src.trim().split(/\s+/).forEach((tok) => {
    if (tok === '|') { ev.push({ bar: true }); return; }
    if (tok[0] === '!') { ann = tok.slice(1).replace(/_/g, ' '); return; }
    if (tok[0] === '@') { sub = Number(tok.slice(1)); return; }
    let notes = [];
    let mark = '';
    let tech = '';
    if (tok[0] === '[') {
      const m = tok.match(/^\[(.+)\]([DUpima]?)$/);
      notes = m[1].split(',').map((t) => parseNote(t).n);
      mark = m[2];
    } else {
      const p = parseNote(tok);
      notes = [p.n];
      mark = p.mark;
      tech = p.tech;
    }
    ev.push({ notes, mark, tech, ann, sub });
    ann = null;
    sub = null;
  });
  return ev;
}
function parseNote(t) {
  const m = t.match(NOTE);
  if (!m) throw new Error('Token de tablatura inválido: ' + t);
  const s = Number(m[2]);
  const dead = m[3] === 'X';
  return {
    n: { s, f: dead ? null : Number(m[3]), to: m[4] ? Number(m[4]) : null, vib: !!m[5] },
    mark: m[6] || '',
    tech: m[1] || '',
  };
}

const MARK = { D: '⊓', U: 'V' };
const TECH = { h: 'h', p: 'p', '/': '/', '\\': '\\', b: '' };

export function tabSvg(ev, { title = '' } = {}) {
  const gy = 13;
  const top = 46;
  const step = 28;
  let x = 20;
  const items = [];
  ev.forEach((e, i) => {
    if (e.bar) { items.push({ bar: true, x: x - step / 2 + 4 }); x += 8; return; }
    items.push({ ...e, x, i });
    x += step;
  });
  const w = x + 6;
  const h = top + 5 * gy + 22;
  const y = (s) => top + (s - 1) * gy;
  const out = [`<svg class="tab" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Tablatura ${title}">`];
  for (let s = 1; s <= 6; s++) out.push(`<line x1="4" x2="${w - 4}" y1="${y(s)}" y2="${y(s)}" class="tb-l"/>`);
  out.push(`<text x="7" y="${y(3) + 4}" class="tb-tab">T</text><text x="7" y="${y(4) + 4}" class="tb-tab">A</text><text x="7" y="${y(5) + 4}" class="tb-tab">B</text>`);
  out.push(`<line x1="4" x2="4" y1="${y(1)}" y2="${y(6)}" class="tb-b"/><line x1="${w - 4}" x2="${w - 4}" y1="${y(1)}" y2="${y(6)}" class="tb-b"/>`);
  items.forEach((it) => {
    if (it.bar) { out.push(`<line x1="${it.x}" x2="${it.x}" y1="${y(1)}" y2="${y(6)}" class="tb-b"/>`); return; }
    const cx = it.x + 14;
    if (it.ann) out.push(`<text x="${cx}" y="12" class="tb-ann">${it.ann}</text>`);
    if (it.sub) out.push(`<text x="${cx}" y="${h - 4}" class="tb-sub">${['', '♩', '♫', '3', '♬'][it.sub] || ''}</text>`);
    if (it.mark) out.push(`<text x="${cx}" y="29" class="tb-mark${/[pima]/.test(it.mark) ? ' rh' : ''}">${MARK[it.mark] || it.mark}</text>`);
    if (it.tech && TECH[it.tech]) out.push(`<text x="${it.x}" y="${y(it.notes[0].s) - 4}" class="tb-tech">${TECH[it.tech]}</text>`);
    it.notes.forEach((n) => {
      const t = n.f === null ? '×' : String(n.f);
      const bw = t.length > 1 ? 16 : 10;
      out.push(`<rect x="${cx - bw / 2}" y="${y(n.s) - 6}" width="${bw}" height="12" class="tb-bg"/>`);
      out.push(`<text x="${cx}" y="${y(n.s) + 4}" class="tb-n" data-i="${it.i}">${t}</text>`);
      if (it.tech === 'b') out.push(`<path d="M${cx + 7} ${y(n.s)} q 7 0 7 -12" class="tb-bend"/><text x="${cx + 14}" y="${y(n.s) - 15}" class="tb-tech">${n.to - n.f === 1 ? '½' : n.to - n.f === 2 ? 'full' : '1½'}</text>`);
      if (n.vib) out.push(`<text x="${cx}" y="${y(1) - 4}" class="tb-tech">~~</text>`);
    });
  });
  out.push('</svg>');
  return out.join('');
}

// Alturas y tiempos para reproducir: [{ midis, beats }] (beats = duración en pulsos)
export function tabNotes(ev, baseSub) {
  let sub = baseSub;
  const list = [];
  ev.forEach((e) => {
    if (e.bar) return;
    if (e.sub) sub = e.sub;
    const midis = e.notes.filter((n) => n.f !== null).map((n) => OPEN_MIDI[n.s] + (n.to ?? n.f));
    list.push({ midis, dur: 1 / sub, i: ev.indexOf(e) });
  });
  return list;
}
