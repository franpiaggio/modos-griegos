// Relaciones V–I, I–V–I y II–V–I: acordes escritos, notas guía que resuelven y qué tocar sobre cada acorde.
// En menor el V7 sale de la menor armónica (7ma subida = sensible), como en la práctica tonal y el jazz.
import { transpose, spellAll, chordById, scaleById, bestRoot, notePc, ivSemis } from './theory.js';

const mod = (n) => ((n % 12) + 12) % 12;

export const PROGS = [
  ['v-i', 'V – I', ['V', 'I']],
  ['i-v-i', 'I – V – I', ['I', 'V', 'I']],
  ['ii-v-i', 'II – V – I', ['II', 'V', 'I', 'I']],
];

// Tipo de acorde de cada grado según modo y nivel
const TYPES = {
  mayor: { triadas: { I: 'mayor', V: 'mayor', II: 'menor' }, '7': { I: 'maj7', V: '7', II: 'm7' } },
  menor: { triadas: { I: 'menor', V: 'mayor', II: 'dim' }, '7': { I: 'm7', V: '7', II: 'm7b5' } },
};
const ROMAN = {
  mayor: { triadas: { I: 'I', V: 'V', II: 'IIm' }, '7': { I: 'Imaj7', V: 'V7', II: 'IIm7' } },
  menor: { triadas: { I: 'Im', V: 'V', II: 'II°' }, '7': { I: 'Im7', V: 'V7', II: 'IIm7(b5)' } },
};
// Escala principal y alternativas sobre cada grado
const SCALES_FOR = {
  mayor: { I: ['jonico', 'lidio'], V: ['mixolidio', 'alterada'], II: ['dorico'] },
  menor: { I: ['eolico', 'menor-armonica', 'menor-melodica'], V: ['frigio-dom', 'alterada'], II: ['locrio', 'locrio-n2'] },
};
const DEG_IV = { I: '1', II: '2', V: '5' };
const FN = { I: 'Tónica (reposo)', V: 'Dominante (tensión)', II: 'Subdominante (preparación)' };

export function keyRoot(pc, mode) {
  return bestRoot(pc, scaleById(mode === 'mayor' ? 'jonico' : 'menor-armonica').intervals);
}

// Acorde de un grado: { deg, roman, root (nota), chord, notes, scales: [{ id, root, pc, name }] }
export function degreeChord(tonic, mode, level, deg) {
  const root = transpose(tonic, DEG_IV[deg]);
  const chord = chordById(TYPES[mode][level][deg]);
  const scales = SCALES_FOR[mode][deg].map((id) => ({ id, root, pc: notePc(root), scale: scaleById(id) }));
  return { deg, roman: ROMAN[mode][level][deg], fn: FN[deg], root, chord, notes: spellAll(root, chord.intervals), scales };
}

export function progression(tonicPc, mode, level, progId) {
  const tonic = keyRoot(tonicPc, mode);
  const [, , degs] = PROGS.find((p) => p[0] === progId) || PROGS[0];
  const uniq = {};
  degs.forEach((d) => (uniq[d] ||= degreeChord(tonic, mode, level, d)));
  return { tonic, degs, chords: degs.map((d) => uniq[d]), byDeg: uniq };
}

// Movimiento más corto entre dos alturas (semitonos con signo)
export function motion(fromPc, toPc) {
  let d = mod(toPc - fromPc);
  if (d > 6) d -= 12;
  return d;
}
const toneOf = (c, iv) => {
  const i = c.chord.intervals.indexOf(iv);
  return i < 0 ? null : c.notes[i];
};
const thirdIv = (c) => c.chord.intervals.find((x) => x === '3' || x === 'b3');
const seventhIv = (c) => c.chord.intervals.find((x) => x === '7' || x === 'b7' || x === 'bb7');
const fifthIv = (c) => c.chord.intervals.find((x) => /5$/.test(x));

// Notas guía de una resolución A → B: [{ from, to, fromIv, toIv, semis, text }]
export function guideTones(a, b, mode) {
  const out = [];
  const add = (fromIv, toIv, text) => {
    const from = toneOf(a, fromIv); const to = toneOf(b, toIv);
    if (!from || !to) return;
    out.push({ from, to, fromIv, toIv, semis: motion(notePc(from), notePc(to)), text });
  };
  if (a.deg === 'V' && b.deg === 'I') {
    add('3', '1', mode === 'menor' ? 'La 3ra del V es la sensible (7ma de la menor armónica): sube un semitono a la tónica.' : 'La 3ra del V es la sensible: sube un semitono a la tónica.');
    if (seventhIv(a)) add(seventhIv(a), thirdIv(b), mode === 'menor' ? 'La 7ma del V baja a la 3ra menor del I.' : 'La 7ma del V baja un semitono a la 3ra del I.');
    add('1', '1', 'El bajo cae una 5ta (o sube una 4ta): V → I.');
  } else if (a.deg === 'I' && b.deg === 'V') {
    add('1', '3', 'La tónica baja un semitono a la sensible: aparece la tensión.');
    if (seventhIv(b)) add(thirdIv(a), seventhIv(b), 'La 3ra del I se mueve a la 7ma del V.');
    add('5', '1', 'La 5ta del I es nota común: es la fundamental del V.');
  } else if (a.deg === 'II' && b.deg === 'V') {
    if (seventhIv(a)) add(seventhIv(a), '3', 'La 7ma del II baja a la 3ra del V (sensible).');
    add(thirdIv(a), seventhIv(b) || fifthIv(b), seventhIv(b) ? 'La 3ra del II queda como 7ma del V (nota común).' : 'La 3ra del II pasa a la 5ta del V.');
    add('1', '1', 'El bajo cae una 5ta: II → V.');
  }
  return out;
}

// El tritono del V7 (3ra y 7ma) y cómo resuelve
export function tritone(v, i) {
  if (!seventhIv(v)) return null;
  const t3 = toneOf(v, '3'); const t7 = toneOf(v, seventhIv(v));
  return { t3, t7, to3: toneOf(i, '1'), to7: toneOf(i, thirdIv(i)), semis: mod(ivSemis(seventhIv(v)) - ivSemis('3')) };
}
