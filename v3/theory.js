// Teoría: escalas (7 modos) y arpegios en cualquier tónica, sobre las 7 posiciones del modelo.
// Notas: [cuerda (1 = Mi aguda, 6 = Mi grave), traste, dedo]. `start` = traste de la primera casilla.

export const OPEN_PC = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
export const OPEN_MIDI = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

export const NOTE_NAMES = {
  latin: ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'],
  english: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
};

// Escala mayor de Do en 7 posiciones (transcripta del modelo "Posición Escala Mayor").
const MAJOR7_C = [
  { start: 1, notes: [[1, 1, 1], [1, 3, 2], [1, 5, 4], [2, 3, 2], [2, 5, 4], [3, 2, 1], [3, 4, 3], [3, 5, 4], [4, 2, 1], [4, 3, 2], [4, 5, 4], [5, 2, 1], [5, 3, 2], [5, 5, 4], [6, 1, 1], [6, 3, 2], [6, 5, 4]] },
  { start: 3, notes: [[1, 3, 1], [1, 5, 2], [1, 7, 4], [2, 5, 2], [2, 6, 3], [3, 4, 1], [3, 5, 2], [3, 7, 4], [4, 3, 1], [4, 5, 2], [4, 7, 4], [5, 3, 1], [5, 5, 2], [5, 7, 4], [6, 3, 1], [6, 5, 2], [6, 7, 4]] },
  { start: 5, notes: [[1, 5, 1], [1, 7, 3], [1, 8, 4], [2, 5, 1], [2, 6, 2], [2, 8, 4], [3, 5, 1], [3, 7, 3], [4, 5, 1], [4, 7, 3], [4, 9, 4], [5, 5, 1], [5, 7, 3], [5, 8, 4], [6, 5, 1], [6, 7, 3], [6, 8, 4]] },
  { start: 7, notes: [[1, 7, 1], [1, 8, 2], [1, 10, 4], [2, 8, 2], [2, 10, 4], [3, 7, 1], [3, 9, 3], [3, 10, 4], [4, 7, 1], [4, 9, 3], [4, 10, 4], [5, 7, 1], [5, 8, 2], [5, 10, 4], [6, 7, 1], [6, 8, 2], [6, 10, 4]] },
  { start: 8, notes: [[1, 8, 1], [1, 10, 2], [1, 12, 4], [2, 10, 2], [2, 12, 4], [3, 9, 1], [3, 10, 2], [3, 12, 4], [4, 9, 1], [4, 10, 2], [4, 12, 4], [5, 8, 1], [5, 10, 2], [5, 12, 4], [6, 8, 1], [6, 10, 2], [6, 12, 4]] },
  { start: 10, notes: [[1, 10, 1], [1, 12, 3], [1, 13, 4], [2, 10, 1], [2, 12, 3], [2, 13, 4], [3, 10, 1], [3, 12, 3], [4, 10, 1], [4, 12, 2], [4, 14, 4], [5, 10, 1], [5, 12, 3], [5, 14, 4], [6, 10, 1], [6, 12, 3], [6, 13, 4]] },
  { start: 12, notes: [[1, 12, 1], [1, 13, 2], [1, 15, 4], [2, 12, 1], [2, 13, 2], [2, 15, 4], [3, 12, 1], [3, 14, 3], [4, 12, 1], [4, 14, 3], [4, 15, 4], [5, 12, 1], [5, 14, 3], [5, 15, 4], [6, 12, 1], [6, 13, 2], [6, 15, 4]] },
];

export const MODES = [
  { id: 'jonico', name: 'Jónico', offset: 0, color: '#CE3468', alias: 'Escala mayor', intervals: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'dorico', name: 'Dórico', offset: 2, color: '#2C6DB5', intervals: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
  { id: 'frigio', name: 'Frigio', offset: 4, color: '#2E9A5F', intervals: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'] },
  { id: 'lidio', name: 'Lidio', offset: 5, color: '#8E4CC0', intervals: ['1', '2', '3', '#4', '5', '6', '7'] },
  { id: 'mixolidio', name: 'Mixolidio', offset: 7, color: '#E07A1F', intervals: ['1', '2', '3', '4', '5', '6', 'b7'] },
  { id: 'eolico', name: 'Eólico', offset: 9, color: '#14A0A8', alias: 'Menor natural', intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  { id: 'locrio', name: 'Locrio', offset: 11, color: '#7A5536', intervals: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'] },
];

// Semitonos -> nombre de intervalo
const IV = { 0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7' };
const ivToSemis = (s) => ({ 1: 0, b2: 1, 2: 2, b3: 3, 3: 4, 4: 5, '#4': 6, b5: 6, 5: 7, '#5': 8, b6: 8, 6: 9, bb7: 9, b7: 10, 7: 11 })[s];

export const CHORDS = [
  { id: 'mayor', name: 'Tríada mayor', short: '', group: 'Tríadas', intervals: ['1', '3', '5'], color: '#CE3468' },
  { id: 'menor', name: 'Tríada menor', short: 'm', group: 'Tríadas', intervals: ['1', 'b3', '5'], color: '#2C6DB5' },
  { id: 'maj7', name: 'Mayor 7', short: 'maj7', group: 'Con 7ma', intervals: ['1', '3', '5', '7'], color: '#8E4CC0' },
  { id: 'm7', name: 'Menor 7', short: 'm7', group: 'Con 7ma', intervals: ['1', 'b3', '5', 'b7'], color: '#14A0A8' },
  { id: 'dom7', name: 'Dominante 7', short: '7', group: 'Con 7ma', intervals: ['1', '3', '5', 'b7'], color: '#E07A1F' },
  { id: 'm7b5', name: 'Semidisminuido', short: 'm7(b5)', group: 'Con 7ma', intervals: ['1', 'b3', 'b5', 'b7'], color: '#7A5536' },
  { id: 'dim7', name: 'Disminuido 7', short: 'dim7', group: 'Con 7ma', intervals: ['1', 'b3', 'b5', 'bb7'], color: '#2E9A5F' },
];

const pc = (s, f) => (OPEN_PC[s] + f) % 12;
export const midiOf = (s, f) => OPEN_MIDI[s] + f;

// Mueve las 7 figuras de Do mayor a otra tonalidad, manteniendo cada ventana entre los trastes 1 y 12.
function majorPositions(parentPc) {
  return MAJOR7_C.map((p) => {
    let s = p.start + parentPc;
    while (s > 12) s -= 12;
    while (s < 1) s += 12;
    const d = s - p.start;
    return { start: s, notes: p.notes.map(([st, f, fg]) => [st, f + d, fg]) };
  }).sort((a, b) => a.start - b.start);
}

// Digitación sugerida para un arpegio dentro de una ventana de 5 trastes (un dedo por traste).
function fingerArp(notes, start) {
  const byString = {};
  notes.forEach((n) => (byString[n[0]] ||= []).push(n));
  Object.values(byString).forEach((list) => {
    list.sort((a, b) => b[1] - a[1]);
    let prev = 5;
    list.forEach((n) => {
      const f = Math.max(1, Math.min(n[1] - start + 1, 4, prev - 1));
      n[2] = f;
      prev = f;
    });
  });
  return notes;
}

/**
 * kind: 'escala' | 'arpegio'; root: 0..11; typeId: id de modo o de acorde.
 * Devuelve { positions, tonicPc, intervalOf(pc), color, title, subtitle }.
 */
export function build(kind, root, typeId) {
  if (kind === 'escala') {
    const mode = MODES.find((m) => m.id === typeId) || MODES[0];
    const parent = (root - mode.offset + 12) % 12;
    const allowed = new Map(mode.intervals.map((iv) => [(root + ivToSemis(iv)) % 12, iv]));
    return {
      positions: majorPositions(parent),
      tonicPc: root,
      label: (p) => allowed.get(p) ?? IV[(p - root + 12) % 12],
      color: mode.color,
      mode,
      parentPc: parent,
    };
  }
  const chord = CHORDS.find((c) => c.id === typeId) || CHORDS[0];
  const tones = new Map(chord.intervals.map((iv) => [(root + ivToSemis(iv)) % 12, iv]));
  const windows = majorPositions(root).map((p) => p.start);
  const positions = windows.map((start) => {
    const notes = [];
    for (let s = 1; s <= 6; s++) for (let f = start; f <= start + 4; f++) if (tones.has(pc(s, f))) notes.push([s, f, 0]);
    return { start, notes: fingerArp(notes, start) };
  });
  return { positions, tonicPc: root, label: (p) => tones.get(p), color: chord.color, chord };
}

export const pcOf = pc;

// Tónicas disponibles (con su nombre preferido)
export const ROOTS = [[0, "C"], [1, "Db"], [2, "D"], [3, "Eb"], [4, "E"], [5, "F"], [6, "F#"], [7, "G"], [8, "Ab"], [9, "A"], [10, "Bb"], [11, "B"]];
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NAT = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LATIN = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };
const ACC = { "-2": "bb", "-1": "b", 0: "", 1: "#", 2: "##" };

const ALT = { 1: ["C#", "Db"], 3: ["D#", "Eb"], 6: ["F#", "Gb"], 8: ["G#", "Ab"], 10: ["A#", "Bb"] };
const toLatin = (n) => LATIN[n[0]] + n.slice(1);

// Elige la escritura de la tónica con menos alteraciones para esos intervalos (ej. Do# frigio, no Reb frigio).
export function rootSpelling(root, intervals) {
  const opts = ALT[root] || [ROOTS[root][1]];
  if (!intervals || opts.length === 1) return ROOTS[root][1];
  const cost = (n) => [...spellLetters(n, root, intervals).values()].reduce((t, x) => t + (x.length - 1) + (/##|bb/.test(x) ? 5 : 0), 0);
  return opts.reduce((best, n) => (cost(n) < cost(best) ? n : best), ROOTS[root][1]);
}

export function rootName(root, notation, intervals) {
  const n = rootSpelling(root, intervals);
  return notation === "latin" ? toLatin(n) : n;
}

// Etiqueta del botón de tónica: muestra las dos escrituras enarmónicas
export function rootLabel(root, notation) {
  const list = ALT[root] || [ROOTS[root][1]];
  return list.map((n) => (notation === "latin" ? toLatin(n) : n)).join("/");
}

function spellLetters(rootStr, root, intervals) {
  const rl = LETTERS.indexOf(rootStr[0]);
  const map = new Map();
  intervals.forEach((iv) => {
    const deg = Number(iv.replace(/[^0-9]/g, ""));
    const letter = LETTERS[(rl + deg - 1) % 7];
    const p = (root + ivToSemis(iv)) % 12;
    let d = ((p - NAT[letter]) % 12 + 12) % 12;
    if (d > 6) d -= 12;
    map.set(p, letter + ACC[d]);
  });
  return map;
}

// Nombra cada nota de la escala/acorde con la letra que le corresponde (ej. Fa dórico: Lab, no Sol#).
export function spell(root, intervals, notation) {
  const m = spellLetters(rootSpelling(root, intervals), root, intervals);
  if (notation === "latin") m.forEach((v, k) => m.set(k, toLatin(v)));
  return m;
}
