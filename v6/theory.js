// Teoría v4: notas escritas con su letra, intervalos, escalas, acordes, armonía y posiciones en el mástil.
// Convenciones: cuerdas 1 (Mi aguda) a 6 (Mi grave). Notas de una posición: [cuerda, traste, dedo].
// Fuentes y criterios: ver v4/INVESTIGACION.md (Berklee chord-scale, Levine, Wikipedia "Jazz scale").

export const OPEN_PC = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
export const OPEN_MIDI = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
export const pcOf = (s, f) => (OPEN_PC[s] + f) % 12;
export const midiOf = (s, f) => OPEN_MIDI[s] + f;
const mod = (n, m = 12) => ((n % m) + m) % m;

// ---------------------------------------------------------------- notas escritas
// Una nota es { l: letra 0..6 (Do..Si), a: alteración -2..2 }.
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LATIN = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const NAT = [0, 2, 4, 5, 7, 9, 11];
const ACC = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' };
export const note = (l, a = 0) => ({ l: mod(l, 7), a });
export const notePc = (n) => mod(NAT[n.l] + n.a);
export const sameNote = (x, y) => x.l === y.l && x.a === y.a;
export function noteName(n, notation = 'latin') {
  if (!n) return '';
  return (notation === 'latin' ? LATIN : LETTERS)[n.l] + (ACC[n.a] ?? '?');
}
export function parseNote(s) {
  const m = String(s).trim().match(/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])(bb|b|##|#|x)?$/i);
  if (!m) return null;
  const base = m[1].length === 1 ? m[1].toUpperCase() : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  const l = base.length === 1 ? LETTERS.indexOf(base) : LATIN.indexOf(base);
  const a = { bb: -2, b: -1, '': 0, '#': 1, '##': 2, x: 2 }[m[2] || ''];
  return note(l, a);
}
// Escritura preferida de cada altura cuando no hay contexto
export const PREF = [note(0), note(1, -1), note(1), note(2, -1), note(2), note(3), note(3, 1), note(4), note(5, -1), note(5), note(6, -1), note(6)];
// Las dos escrituras de una tecla negra (o una sola)
export function spellingsOf(pc) {
  const out = [];
  for (let l = 0; l < 7; l++) for (const a of [0, 1, -1]) if (notePc(note(l, a)) === pc) out.push(note(l, a));
  out.sort((x, y) => Math.abs(x.a) - Math.abs(y.a) || y.a - x.a);
  // tecla blanca: solo el nombre natural (no Si#, Fab, Mi#, Dob)
  return out[0].a === 0 ? [out[0]] : out;
}

// ---------------------------------------------------------------- intervalos
// Nombres de intervalo como fórmula: '1' 'b2' '2' '#2' 'b3' '3' '4' '#4' 'b5' '5' '#5' 'b6' '6' 'bb7' 'b7' '7' 'b9' '9' '#9' '11' '#11' 'b13' '13'
const BASE = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12, 9: 14, 10: 16, 11: 17, 12: 19, 13: 21 };
export function ivParse(iv) {
  const m = String(iv).match(/^(bb|b|##|#)?(\d+)$/);
  const acc = { bb: -2, b: -1, '': 0, '#': 1, '##': 2 }[m[1] || ''];
  const deg = Number(m[2]);
  return { deg, semis: BASE[deg] + acc, acc };
}
export const ivSemis = (iv) => mod(ivParse(iv).semis);
export function transpose(n, iv) {
  const { deg, semis } = ivParse(iv);
  const l = mod(n.l + deg - 1, 7);
  let a = mod(notePc(n) + semis - NAT[l]);
  if (a > 6) a -= 12;
  return note(l, a);
}
// Bajar un intervalo (para construir intervalos descendentes)
export function transposeDown(n, iv) {
  const { deg, semis } = ivParse(iv);
  const l = mod(n.l - (deg - 1), 7);
  let a = mod(notePc(n) - semis - NAT[l]);
  if (a > 6) a -= 12;
  return note(l, a);
}

const PERFECT = new Set([1, 4, 5, 8]);
const IV_WORD = { 1: 'Unísono', 2: 'Segunda', 3: 'Tercera', 4: 'Cuarta', 5: 'Quinta', 6: 'Sexta', 7: 'Séptima', 8: 'Octava' };
const Q_LONG = { J: 'justa', M: 'mayor', m: 'menor', d: 'disminuida', A: 'aumentada', dd: 'doble disminuida', AA: 'doble aumentada' };
// Intervalos simples (ascendentes) que se practican, con su abreviatura argentina (3m, 5J, 4A...)
export const INTERVALS = [
  { id: '2m', deg: 2, semis: 1 }, { id: '2M', deg: 2, semis: 2 }, { id: '3m', deg: 3, semis: 3 }, { id: '3M', deg: 3, semis: 4 },
  { id: '4J', deg: 4, semis: 5 }, { id: '4A', deg: 4, semis: 6 }, { id: '5d', deg: 5, semis: 6 }, { id: '5J', deg: 5, semis: 7 },
  { id: '5A', deg: 5, semis: 8 }, { id: '6m', deg: 6, semis: 8 }, { id: '6M', deg: 6, semis: 9 }, { id: '7d', deg: 7, semis: 9 },
  { id: '7m', deg: 7, semis: 10 }, { id: '7M', deg: 7, semis: 11 }, { id: '8J', deg: 8, semis: 12 },
  { id: '2A', deg: 2, semis: 3 }, { id: '3d', deg: 3, semis: 2 }, { id: '6A', deg: 6, semis: 10 }, { id: '4d', deg: 4, semis: 4 },
];
export function intervalLong(id) {
  const deg = Number(id.match(/\d+/)[0]);
  const q = id.replace(/\d+/, '');
  return `${IV_WORD[deg]} ${Q_LONG[q]}`;
}
// Intervalo ascendente entre dos notas escritas (simple, dentro de la octava)
export function intervalBetween(x, y) {
  let steps = mod(y.l - x.l, 7);
  let semis = mod(notePc(y) - notePc(x));
  const deg = steps + 1;
  if (deg === 1 && semis > 6) semis -= 12;
  const ref = NAT[steps]; // distancia de la escala mayor de x
  let diff = semis - ref;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  let q;
  if (PERFECT.has(deg)) q = { '-2': 'dd', '-1': 'd', 0: 'J', 1: 'A', 2: 'AA' }[diff];
  else q = { '-3': 'dd', '-2': 'd', '-1': 'm', 0: 'M', 1: 'A', 2: 'AA' }[diff];
  return { deg, semis: mod(semis), q, id: `${deg}${q}` };
}
// Convierte una abreviatura (3m) en intervalo de fórmula (b3) para transponer
export function idToFormula(id) {
  const deg = Number(id.match(/\d+/)[0]);
  const q = id.replace(/\d+/, '');
  if (PERFECT.has(deg)) return ({ J: '', d: 'b', A: '#', dd: 'bb', AA: '##' }[q]) + (deg === 8 ? 1 : deg);
  return ({ M: '', m: 'b', d: 'bb', A: '#' }[q]) + deg;
}

// ---------------------------------------------------------------- escalas
// offset = semitonos desde la tónica de la escala madre de su familia.
export const SCALES = [
  // Escala mayor y modos griegos (colores del modelo v2/v3)
  { id: 'jonico', fam: 'mayor', name: 'Jónico', alias: 'Escala mayor', offset: 0, color: '#CE3468', intervals: ['1', '2', '3', '4', '5', '6', '7'], chord: 'maj7', char: '4 (a evitar sobre maj7), 7' },
  { id: 'dorico', fam: 'mayor', name: 'Dórico', offset: 2, color: '#2C6DB5', intervals: ['1', '2', 'b3', '4', '5', '6', 'b7'], chord: 'm7', char: '6 mayor' },
  { id: 'frigio', fam: 'mayor', name: 'Frigio', offset: 4, color: '#2E9A5F', intervals: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], chord: 'm7', char: 'b2' },
  { id: 'lidio', fam: 'mayor', name: 'Lidio', offset: 5, color: '#8E4CC0', intervals: ['1', '2', '3', '#4', '5', '6', '7'], chord: 'maj7', char: '#4' },
  { id: 'mixolidio', fam: 'mayor', name: 'Mixolidio', offset: 7, color: '#E07A1F', intervals: ['1', '2', '3', '4', '5', '6', 'b7'], chord: '7', char: 'b7 con 3 mayor' },
  { id: 'eolico', fam: 'mayor', name: 'Eólico', alias: 'Menor natural', offset: 9, color: '#14A0A8', intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], chord: 'm7', char: 'b6' },
  { id: 'locrio', fam: 'mayor', name: 'Locrio', offset: 11, color: '#7A5536', intervals: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], chord: 'm7b5', char: 'b5 y b2' },
  // Pentatónicas y blues
  { id: 'penta-mayor', fam: 'penta', name: 'Pentatónica mayor', offset: 0, color: '#CE3468', intervals: ['1', '2', '3', '5', '6'], chord: 'mayor', char: 'sin 4 ni 7 (sin semitonos)' },
  { id: 'penta-menor', fam: 'penta', name: 'Pentatónica menor', offset: 9, color: '#2C6DB5', intervals: ['1', 'b3', '4', '5', 'b7'], chord: 'm7', char: 'sin 2 ni 6 (sin semitonos)' },
  { id: 'blues', fam: 'penta', name: 'Escala de blues', alias: 'Pentatónica menor + b5 (blue note)', offset: 9, color: '#14A0A8', intervals: ['1', 'b3', '4', 'b5', '5', 'b7'], chord: '7', char: 'b5 (blue note)' },
  { id: 'blues-mayor', fam: 'penta', name: 'Pentatónica mixolidia', alias: 'Pentatónica mayor + b7 (nota mixolidia)', offset: 0, color: '#E07A1F', intervals: ['1', '2', '3', '5', '6', 'b7'], chord: '7', char: 'b7 (nota mixolidia)' },
  // Menor armónica y sus modos
  { id: 'menor-armonica', fam: 'armonica', name: 'Menor armónica', offset: 0, color: '#CE3468', intervals: ['1', '2', 'b3', '4', '5', 'b6', '7'], chord: 'mMaj7', char: 'b6 y 7 (2da aumentada)' },
  { id: 'locrio-n6', fam: 'armonica', name: 'Locrio ♮6', offset: 2, color: '#7A5536', intervals: ['1', 'b2', 'b3', '4', 'b5', '6', 'b7'], chord: 'm7b5', char: '6 mayor' },
  { id: 'jonico-s5', fam: 'armonica', name: 'Jónico #5', alias: 'Jónico aumentado', offset: 3, color: '#8E4CC0', intervals: ['1', '2', '3', '4', '#5', '6', '7'], chord: 'maj7s5', char: '#5' },
  { id: 'dorico-s4', fam: 'armonica', name: 'Dórico #4', offset: 5, color: '#2C6DB5', intervals: ['1', '2', 'b3', '#4', '5', '6', 'b7'], chord: 'm7', char: '#4' },
  { id: 'frigio-dom', fam: 'armonica', name: 'Frigio dominante', alias: 'Mixolidio b9 b13', offset: 7, color: '#E07A1F', intervals: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], chord: '7', char: 'b2 con 3 mayor' },
  { id: 'lidio-s2', fam: 'armonica', name: 'Lidio #2', alias: 'Lidio #9', offset: 8, color: '#2E9A5F', intervals: ['1', '#2', '3', '#4', '5', '6', '7'], chord: 'maj7', char: '#2' },
  { id: 'ultralocrio', fam: 'armonica', name: 'Superlocrio bb7', alias: 'Ultralocrio', offset: 11, color: '#14A0A8', intervals: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'bb7'], chord: 'dim7', char: 'bb7' },
  // Menor melódica (ascendente, "menor jazz") y sus modos
  { id: 'menor-melodica', fam: 'melodica', name: 'Menor melódica', alias: 'Menor jazz', offset: 0, color: '#CE3468', intervals: ['1', '2', 'b3', '4', '5', '6', '7'], chord: 'mMaj7', char: '6 y 7 mayores con 3 menor' },
  { id: 'dorico-b2', fam: 'melodica', name: 'Dórico b2', alias: 'Frigio ♮6', offset: 2, color: '#2E9A5F', intervals: ['1', 'b2', 'b3', '4', '5', '6', 'b7'], chord: 'm7', char: 'b2 con 6 mayor' },
  { id: 'lidio-aum', fam: 'melodica', name: 'Lidio aumentado', alias: 'Lidio #5', offset: 3, color: '#8E4CC0', intervals: ['1', '2', '3', '#4', '#5', '6', '7'], chord: 'maj7s5', char: '#4 y #5' },
  { id: 'lidio-dom', fam: 'melodica', name: 'Lidio dominante', alias: 'Lidio b7 / Mixolidio #11', offset: 5, color: '#E07A1F', intervals: ['1', '2', '3', '#4', '5', '6', 'b7'], chord: '7', char: '#4 con b7' },
  { id: 'mixolidio-b6', fam: 'melodica', name: 'Mixolidio b6', alias: 'Mixolidio b13', offset: 7, color: '#2C6DB5', intervals: ['1', '2', '3', '4', '5', 'b6', 'b7'], chord: '7', char: 'b6 con 3 mayor' },
  { id: 'locrio-n2', fam: 'melodica', name: 'Locrio ♮2', alias: 'Semidisminuida', offset: 9, color: '#7A5536', intervals: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'], chord: 'm7b5', char: '2 mayor' },
  { id: 'alterada', fam: 'melodica', name: 'Alterada', alias: 'Superlocria', offset: 11, color: '#14A0A8', intervals: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'], chord: '7', char: 'b9 #9 #11 b13 (= b2 b3 b5 b6)' },
];
// Simétricas (para improvisación; no se dibujan en 7 posiciones)
export const EXTRA_SCALES = [
  { id: 'dis-st', name: 'Disminuida semitono-tono', alias: 'Dominante disminuida', intervals: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'] },
  { id: 'dis-ts', name: 'Disminuida tono-semitono', intervals: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'] },
  { id: 'tonos', name: 'Tonos enteros', intervals: ['1', '2', '3', '#4', '#5', 'b7'] },
];
export const FAMILIES = [
  { id: 'mayor', name: 'Modos griegos', long: 'Escala mayor y sus modos', parent: 'jonico', info: 'Los 7 modos comparten las mismas 7 figuras de la escala mayor de origen; cambia la nota que funciona como tónica.' },
  { id: 'penta', name: 'Pentatónicas', long: 'Pentatónicas y blues', parent: 'penta-mayor', info: '5 notas sin semitonos. La mayor y la menor relativa comparten las 5 figuras. La escala de blues agrega la b5 (blue note) a la menor; la pentatónica mixolidia agrega la b7 a la mayor.' },
  { id: 'armonica', name: 'Menor armónica', long: 'Menor armónica y sus modos', parent: 'menor-armonica', info: 'Menor natural con la 7ma mayor (sensible). Genera el V7 en tonalidad menor; su modo más usado es el Frigio dominante (V7 → Im).' },
  { id: 'melodica', name: 'Menor melódica', long: 'Menor melódica y sus modos', parent: 'menor-melodica', info: 'Menor con 6ta y 7ma mayores (forma ascendente, "menor jazz"). Sus modos dan el Lidio dominante (subV7), el Locrio ♮2 (m7(b5)) y la Alterada (V7alt).' },
];
// "La Dórico", pero "Escala de blues de La" (no "La Escala de blues")
export const scaleTitle = (rootName, s) => (s.name.startsWith('Escala ') ? `${s.name} de ${rootName}` : `${rootName} ${s.name}`);
export const scaleById = (id) => SCALES.find((s) => s.id === id) || EXTRA_SCALES.find((s) => s.id === id);
export const scalesOf = (fam) => SCALES.filter((s) => s.fam === fam);

// ---------------------------------------------------------------- acordes
// sym: cifrado (se antepone la tónica). Orden de grupos = orden de dificultad usual.
export const CHORDS = [
  { id: 'mayor', sym: '', name: 'Mayor', group: 'Tríadas', intervals: ['1', '3', '5'], color: '#CE3468' },
  { id: 'menor', sym: 'm', name: 'Menor', group: 'Tríadas', intervals: ['1', 'b3', '5'], color: '#2C6DB5' },
  { id: 'dim', sym: '°', name: 'Disminuida', group: 'Tríadas', intervals: ['1', 'b3', 'b5'], color: '#7A5536' },
  { id: 'aum', sym: '+', name: 'Aumentada', group: 'Tríadas', intervals: ['1', '3', '#5'], color: '#8E4CC0' },
  { id: 'sus2', sym: 'sus2', name: 'Sus2', group: 'Tríadas', intervals: ['1', '2', '5'], color: '#2E9A5F' },
  { id: 'sus4', sym: 'sus4', name: 'Sus4', group: 'Tríadas', intervals: ['1', '4', '5'], color: '#E07A1F' },
  { id: 'maj7', sym: 'maj7', name: 'Mayor 7', group: 'Con 7ma', intervals: ['1', '3', '5', '7'], color: '#8E4CC0' },
  { id: '7', sym: '7', name: 'Dominante', group: 'Con 7ma', intervals: ['1', '3', '5', 'b7'], color: '#E07A1F' },
  { id: 'm7', sym: 'm7', name: 'Menor 7', group: 'Con 7ma', intervals: ['1', 'b3', '5', 'b7'], color: '#14A0A8' },
  { id: 'm7b5', sym: 'm7(b5)', name: 'Semidisminuido', group: 'Con 7ma', intervals: ['1', 'b3', 'b5', 'b7'], color: '#7A5536' },
  { id: 'dim7', sym: '°7', name: 'Disminuido', group: 'Con 7ma', intervals: ['1', 'b3', 'b5', 'bb7'], color: '#2E9A5F' },
  { id: 'mMaj7', sym: 'm(maj7)', name: 'Menor 7 mayor', group: 'Con 7ma', intervals: ['1', 'b3', '5', '7'], color: '#2C6DB5' },
  { id: 'maj7s5', sym: 'maj7(#5)', name: 'Mayor 7 aumentado', group: 'Con 7ma', intervals: ['1', '3', '#5', '7'], color: '#CE3468' },
  { id: '7s5', sym: '7(#5)', name: 'Dominante aumentado', group: 'Con 7ma', intervals: ['1', '3', '#5', 'b7'], color: '#E07A1F' },
  { id: '7sus4', sym: '7sus4', name: 'Dominante sus4', group: 'Con 7ma', intervals: ['1', '4', '5', 'b7'], color: '#E07A1F' },
  { id: '6', sym: '6', name: 'Sexta', group: 'Con 7ma', intervals: ['1', '3', '5', '6'], color: '#CE3468' },
  { id: 'm6', sym: 'm6', name: 'Menor sexta', group: 'Con 7ma', intervals: ['1', 'b3', '5', '6'], color: '#2C6DB5' },
  { id: 'add9', sym: 'add9', name: 'Add 9', group: 'Extensiones', intervals: ['1', '3', '5', '9'], color: '#CE3468' },
  { id: '69', sym: '6/9', name: 'Seis nueve', group: 'Extensiones', intervals: ['1', '3', '5', '6', '9'], color: '#CE3468' },
  { id: 'maj9', sym: 'maj9', name: 'Mayor 9', group: 'Extensiones', intervals: ['1', '3', '5', '7', '9'], color: '#8E4CC0' },
  { id: '9', sym: '9', name: 'Dominante 9', group: 'Extensiones', intervals: ['1', '3', '5', 'b7', '9'], color: '#E07A1F' },
  { id: 'm9', sym: 'm9', name: 'Menor 9', group: 'Extensiones', intervals: ['1', 'b3', '5', 'b7', '9'], color: '#14A0A8' },
  { id: 'm11', sym: 'm11', name: 'Menor 11', group: 'Extensiones', intervals: ['1', 'b3', '5', 'b7', '9', '11'], color: '#14A0A8' },
  { id: 'maj7s11', sym: 'maj7(#11)', name: 'Mayor 7 #11', group: 'Extensiones', intervals: ['1', '3', '5', '7', '9', '#11'], color: '#8E4CC0' },
  { id: '9sus4', sym: '9sus4', name: '9 sus4 (11)', group: 'Extensiones', intervals: ['1', '4', '5', 'b7', '9'], color: '#E07A1F' },
  { id: '13', sym: '13', name: 'Dominante 13', group: 'Extensiones', intervals: ['1', '3', '5', 'b7', '9', '13'], color: '#E07A1F' },
  { id: 'm7b9', sym: '7(b9)', name: 'Dominante b9', group: 'Extensiones', intervals: ['1', '3', '5', 'b7', 'b9'], color: '#E07A1F' },
  { id: '7s9', sym: '7(#9)', name: 'Dominante #9', group: 'Extensiones', intervals: ['1', '3', '5', 'b7', '#9'], color: '#E07A1F' },
  { id: '7s11', sym: '7(#11)', name: 'Dominante #11', group: 'Extensiones', intervals: ['1', '3', '5', 'b7', '9', '#11'], color: '#E07A1F' },
  { id: '7b13', sym: '7(b13)', name: 'Dominante b13', group: 'Extensiones', intervals: ['1', '3', 'b7', '9', 'b13'], color: '#E07A1F' },
  { id: 'm9b5', sym: 'm9(b5)', name: 'Semidisminuido 9', group: 'Extensiones', intervals: ['1', 'b3', 'b5', 'b7', '9'], color: '#7A5536' },
];
export const chordById = (id) => CHORDS.find((c) => c.id === id);
export const CHORD_GROUPS = ['Tríadas', 'Con 7ma', 'Extensiones'];
// Grupos que se muestran como arpegio en Información (las extensiones quedan para más adelante)
export const ARP_GROUPS = ['Tríadas', 'Con 7ma'];

// Reconoce el acorde a partir de sus semitonos desde la fundamental
const CHORD_BY_SET = new Map();
CHORDS.forEach((c) => {
  const key = [...new Set(c.intervals.map(ivSemis))].sort((a, b) => a - b).join(',');
  if (!CHORD_BY_SET.has(key)) CHORD_BY_SET.set(key, c);
});
export function chordFromSemis(semis) {
  return CHORD_BY_SET.get([...new Set(semis.map((x) => mod(x)))].sort((a, b) => a - b).join(',')) || null;
}

// ---------------------------------------------------------------- escritura de tónicas
// Elige la escritura con menos alteraciones para una tónica dada y su fórmula (ej. Do# frigio, no Reb frigio).
const spellCost = (list) => list.reduce((t, n) => t + Math.abs(n.a) + (Math.abs(n.a) > 1 ? 4 : 0), 0);
export function bestRoot(pc, intervals) {
  const opts = spellingsOf(pc);
  if (!intervals) return opts[0];
  let best = opts[0];
  let bc = Infinity;
  opts.forEach((r) => {
    const c = spellCost(intervals.map((iv) => transpose(r, iv))) + Math.abs(r.a) * 0.1;
    if (c < bc) { bc = c; best = r; }
  });
  return best;
}
export const spellAll = (root, intervals) => intervals.map((iv) => transpose(root, iv));
export const chordSymbol = (root, chord, notation = 'english') => noteName(root, notation) + chord.sym;

// Tónicas disponibles en los selectores: 12 alturas
export const ROOT_PCS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export function rootLabel(pc, notation) {
  return spellingsOf(pc).map((n) => noteName(n, notation)).join('/');
}

// ---------------------------------------------------------------- posiciones en el mástil
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
// Pentatónica de Do mayor / La menor en 5 posiciones (página original del libro).
const PENTA5_C = [
  { start: 1, notes: [[1, 3, 2], [1, 5, 4], [2, 3, 2], [2, 5, 4], [3, 2, 1], [3, 5, 4], [4, 2, 1], [4, 5, 4], [5, 3, 2], [5, 5, 4], [6, 3, 2], [6, 5, 4]] },
  { start: 5, notes: [[1, 5, 1], [1, 8, 4], [2, 5, 1], [2, 8, 4], [3, 5, 1], [3, 7, 3], [4, 5, 1], [4, 7, 3], [5, 5, 1], [5, 7, 3], [6, 5, 1], [6, 8, 4]] },
  { start: 7, notes: [[1, 8, 2], [1, 10, 4], [2, 8, 2], [2, 10, 4], [3, 7, 1], [3, 9, 3], [4, 7, 1], [4, 10, 4], [5, 7, 1], [5, 10, 4], [6, 8, 2], [6, 10, 4]] },
  { start: 9, notes: [[1, 10, 1], [1, 12, 3], [2, 10, 1], [2, 13, 4], [3, 9, 1], [3, 12, 3], [4, 10, 1], [4, 12, 3], [5, 10, 1], [5, 12, 3], [6, 10, 1], [6, 12, 3]] },
  { start: 12, notes: [[1, 12, 1], [1, 15, 4], [2, 13, 2], [2, 15, 4], [3, 12, 1], [3, 14, 3], [4, 12, 1], [4, 14, 3], [5, 12, 1], [5, 15, 4], [6, 12, 1], [6, 15, 4]] },
];

// Mueve figuras de Do a otra tonalidad, manteniendo cada ventana entre los trastes 1 y 12.
// El orden es siempre el de las figuras, no el de los trastes.
function shiftFigures(figs, toPc) {
  return figs.map((p) => {
    let s = p.start + toPc;
    while (s > 12) s -= 12;
    while (s < 1) s += 12;
    const d = s - p.start;
    return { start: s, notes: p.notes.map(([st, f, fg]) => [st, f + d, fg]) };
  });
}

// Digitación por cuerda: dedos crecientes con el traste, un dedo por traste dentro de la ventana.
function fingerString(list, start) {
  list.sort((a, b) => b[1] - a[1]);
  let prev = 5;
  list.forEach((n) => {
    const f = Math.max(1, Math.min(n[1] - start + 1, 4, prev - 1));
    n[2] = f;
    prev = f;
  });
}
function fingerAll(notes, start) {
  const by = {};
  notes.forEach((n) => (by[n[0]] ||= []).push(n));
  Object.values(by).forEach((l) => fingerString(l, start));
  return notes;
}

// Altera las notas de una figura (ej. Sol -> Sol# para la menor armónica) sin salir de la ventana de 5 trastes.
function alterFigure(pos, fromPc, delta) {
  const end = pos.start + 4;
  const notes = pos.notes.map((n) => [...n]);
  const has = (m) => notes.some(([s, f]) => midiOf(s, f) === m);
  const touched = new Set();
  for (let i = notes.length - 1; i >= 0; i--) {
    const [s, f, fg] = notes[i];
    if (pcOf(s, f) !== fromPc) continue;
    const target = midiOf(s, f) + delta;
    notes.splice(i, 1);
    if (has(target)) continue; // ya está en otra cuerda
    let placed = false;
    const tries = [s, s - 1, s + 1].filter((x) => x >= 1 && x <= 6);
    for (const t of tries) {
      const nf = target - OPEN_MIDI[t];
      if (nf >= pos.start && nf <= end && !notes.some(([a, b]) => a === t && b === nf)) {
        notes.push([t, nf, t === s ? Math.max(1, Math.min(4, fg + delta)) : 0]);
        touched.add(t);
        placed = true;
        break;
      }
    }
    if (!placed) notes.push([s, f + delta, Math.max(1, Math.min(4, fg + delta))]), touched.add(s);
  }
  // re-digita las cuerdas modificadas si quedaron dedos repetidos o desordenados
  touched.forEach((t) => {
    const list = notes.filter((n) => n[0] === t).sort((a, b) => a[1] - b[1]);
    const ok = list.every((n, i) => n[2] >= 1 && (i === 0 || n[2] > list[i - 1][2]));
    if (!ok) fingerString(list, pos.start);
  });
  notes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { start: pos.start, notes };
}

// Agrega una nota (ej. la b5 del blues) donde caiga dentro de la ventana, sin duplicar alturas.
function addToFigure(pos, pc) {
  const notes = pos.notes.map((n) => [...n]);
  const touched = new Set();
  for (let s = 6; s >= 1; s--) {
    for (let f = pos.start; f <= pos.start + 4; f++) {
      if (pcOf(s, f) !== pc) continue;
      const m = midiOf(s, f);
      if (notes.some(([a, b]) => midiOf(a, b) === m)) continue;
      // solo si cae entre notas de la misma cuerda (o al lado), para no estirar la figura
      const own = notes.filter((n) => n[0] === s).map((n) => n[1]);
      if (!own.length || f < Math.min(...own) - 1 || f > Math.max(...own) + 1) continue;
      notes.push([s, f, 0]);
      touched.add(s);
    }
  }
  touched.forEach((t) => fingerString(notes.filter((n) => n[0] === t), pos.start));
  notes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { start: pos.start, notes };
}

function rawScalePositions(scale, rootPc) {
  const famRoot = mod(rootPc - scale.offset);
  if (scale.fam === 'mayor') return shiftFigures(MAJOR7_C, famRoot);
  if (scale.fam === 'armonica' || scale.fam === 'melodica') {
    const rel = mod(famRoot + 3); // mayor relativa: mismas figuras que el modelo
    let figs = shiftFigures(MAJOR7_C, rel);
    figs = figs.map((p) => alterFigure(p, mod(rel + 7), 1)); // 7ma de la menor
    if (scale.fam === 'melodica') figs = figs.map((p) => alterFigure(p, mod(rel + 5), 1)); // 6ta de la menor
    return figs;
  }
  // pentatónicas: figuras del libro, en la mayor relativa
  const rel = mod(famRoot); // famRoot ya es la mayor (offset 0 = penta mayor, 9 = menor relativa)
  let figs = shiftFigures(PENTA5_C, rel);
  if (scale.id === 'blues') figs = figs.map((p) => addToFigure(p, mod(rel + 3))); // b5 de la menor relativa
  if (scale.id === 'blues-mayor') figs = figs.map((p) => addToFigure(p, mod(rel + 10))); // b7 de la mayor
  return figs;
}
// Las posiciones se muestran siempre desde la más grave del mástil (la que empieza en el traste más bajo).
const byFret = (figs) => [...figs].sort((a, b) => a.start - b.start);
export function scalePositions(scale, rootPc) { return byFret(rawScalePositions(scale, rootPc)); }

// Notas marcadas con color propio además de la tónica, con su texto para la leyenda de la hoja.
// Escala de blues: blue note (b5). Pentatónica mixolidia: nota mixolidia (b7).
// Menor armónica y modos: tónica menor de origen + 7ma mayor (alteración respecto de la menor natural).
// Menor melódica y modos: tónica menor de origen + b3 (alteración respecto de la escala mayor).
export const MARK = { blue: '#2C6DB5', green: '#2E9A5F', alt: '#E07A1F', minor: '#8E4CC0' };
export function markedNotes(scale, rootPc) {
  const famRoot = mod(rootPc - scale.offset);
  if (scale.id === 'blues') return [{ pc: mod(rootPc + 6), color: MARK.blue, text: 'Blue note (b5)' }];
  if (scale.id === 'blues-mayor') return [{ pc: mod(rootPc + 10), color: MARK.green, text: 'Nota mixolidia (b7)' }];
  if (scale.fam === 'armonica' || scale.fam === 'melodica') {
    const out = [];
    if (famRoot !== rootPc) out.push({ pc: famRoot, color: MARK.minor, text: 'Tónica menor', root: true });
    if (scale.fam === 'armonica') out.push({ pc: mod(famRoot + 11), color: MARK.alt, text: '7 mayor (vs. menor natural)' });
    else out.push({ pc: mod(famRoot + 3), color: MARK.alt, text: 'b3 (vs. escala mayor)' });
    return out.filter((m) => m.pc !== rootPc);
  }
  return [];
}

// Arpegio: solo las notas del acorde, en ventanas de 5 trastes que arrancan con la tónica en el dedo 1
// (una por cada tónica en las cuerdas 6 a 2). Las formas con la tónica en el dedo 2 o 4 quedan para más adelante.
export function arpeggioPositions(chord, rootPc) {
  const tones = new Set(chord.intervals.map((iv) => mod(rootPc + ivSemis(iv))));
  const starts = new Set();
  for (let s = 6; s >= 2; s--) {
    let f = mod(rootPc - OPEN_PC[s]);
    if (f === 0) f = 12;
    starts.add(f);
  }
  return [...starts].sort((a, b) => a - b).map((start) => {
    const notes = [];
    for (let s = 1; s <= 6; s++) for (let f = start; f <= start + 4; f++) if (tones.has(pcOf(s, f))) notes.push([s, f, 0]);
    return { start, notes: fingerAll(notes, start) };
  });
}

/**
 * Datos para dibujar: kind 'escala' | 'arpegio', rootPc 0..11, id de escala o acorde.
 * Devuelve { positions, meta, root (nota escrita), names: Map pc -> nombre, label(pc) -> intervalo }
 */
export function build(kind, rootPc, id) {
  const meta = kind === 'escala' ? (scaleById(id) || SCALES[0]) : (chordById(id) || CHORDS[0]);
  const root = bestRoot(rootPc, meta.intervals);
  const ivByPc = new Map(meta.intervals.map((iv) => [mod(rootPc + ivSemis(iv)), iv]));
  const spelled = new Map(meta.intervals.map((iv) => [mod(rootPc + ivSemis(iv)), transpose(root, iv)]));
  const positions = kind === 'escala' ? scalePositions(meta, rootPc) : arpeggioPositions(meta, rootPc);
  const marks = kind === 'escala' ? markedNotes(meta, rootPc) : [];
  return { positions, meta, root, rootPc, spelled, marks, label: (p) => ivByPc.get(p) };
}

// ---------------------------------------------------------------- armonía
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
// Cifrado romano estilo Berklee/Argentina: grado en mayúscula + sufijo del acorde (IIm7, V7, VIIm7(b5)).
export function roman(deg, accidental, chord) {
  const acc = accidental < 0 ? 'b'.repeat(-accidental) : '#'.repeat(accidental);
  return acc + ROMAN[deg] + (chord ? chord.sym : '');
}
// Acordes diatónicos (tríadas o cuatríadas) de una escala de 7 notas
export function diatonic(intervals, sevenths = true) {
  const st = intervals.map(ivSemis);
  const major = [0, 2, 4, 5, 7, 9, 11];
  return st.map((r, i) => {
    const pick = (k) => mod(st[(i + k) % 7] - r);
    const set = sevenths ? [0, pick(2), pick(4), pick(6)] : [0, pick(2), pick(4)];
    const chord = chordFromSemis(set);
    let acc = r - major[i];
    if (acc > 6) acc -= 12;
    return { deg: i, semis: r, chord, roman: roman(i, acc, chord), iv: intervals[i] };
  });
}

// Tensiones disponibles y notas a evitar de cada acorde diatónico de la tonalidad mayor (Berklee).
export const MAJOR_FUNCTIONS = [
  { roman: 'Imaj7', deg: 0, chord: 'maj7', fn: 'Tónica', scale: 'jonico', tensions: ['9', '13'], avoid: ['11'], alt: ['lidio'] },
  { roman: 'IIm7', deg: 1, chord: 'm7', fn: 'Subdominante', scale: 'dorico', tensions: ['9', '11'], avoid: ['13'], alt: [], note: 'Berklee considera la 13 nota a evitar (tritono con la 3ra); otros autores la aceptan.' },
  { roman: 'IIIm7', deg: 2, chord: 'm7', fn: 'Tónica', scale: 'frigio', tensions: ['11'], avoid: ['b9', 'b13'], alt: [] },
  { roman: 'IVmaj7', deg: 3, chord: 'maj7', fn: 'Subdominante', scale: 'lidio', tensions: ['9', '#11', '13'], avoid: [], alt: [] },
  { roman: 'V7', deg: 4, chord: '7', fn: 'Dominante', scale: 'mixolidio', tensions: ['9', '13'], avoid: ['11'], alt: ['alterada', 'dis-st', 'lidio-dom'] },
  { roman: 'VIm7', deg: 5, chord: 'm7', fn: 'Tónica', scale: 'eolico', tensions: ['9', '11'], avoid: ['b13'], alt: ['dorico'] },
  { roman: 'VIIm7(b5)', deg: 6, chord: 'm7b5', fn: 'Dominante', scale: 'locrio', tensions: ['11', 'b13'], avoid: ['b9'], alt: ['locrio-n2'] },
];

// Dominantes secundarios en mayor: V7 de cada acorde diatónico excepto el VII (disminuido, no puede ser tónica).
export const SECONDARY = [
  { id: 'V/II', target: 1, scale: 'mixolidio-b6', tensions: ['9', 'b13'], related: 'IIIm7' },
  { id: 'V/III', target: 2, scale: 'frigio-dom', tensions: ['b9', '#9', 'b13'], related: '#IVm7(b5)' },
  { id: 'V/IV', target: 3, scale: 'mixolidio', tensions: ['9', '13'], related: 'Vm7' },
  { id: 'V/V', target: 4, scale: 'mixolidio', tensions: ['9', '13'], related: 'VIm7' },
  { id: 'V/VI', target: 5, scale: 'frigio-dom', tensions: ['b9', 'b13'], related: 'VIIm7(b5)', note: 'Algunos autores agregan #9.' },
];

// Intercambio modal en mayor: acordes prestados de los modos paralelos (ej. Do mayor toma de Do menor).
// semis/l = posición de la fundamental respecto de la tónica (semitonos y paso de letra).
export const BORROWED = [
  { roman: 'IVm7', semis: 5, step: 3, chord: 'm7', from: 'eolico', scale: 'dorico', note: 'Subdominante menor: el más usado.' },
  { roman: 'IVm6', semis: 5, step: 3, chord: 'm6', from: 'eolico', scale: 'dorico', note: 'Subdominante menor con 6ta (melódica).' },
  { roman: 'IIm7(b5)', semis: 2, step: 1, chord: 'm7b5', from: 'eolico', scale: 'locrio-n2' },
  { roman: 'bIIImaj7', semis: 3, step: 2, chord: 'maj7', from: 'eolico', scale: 'lidio' },
  { roman: 'Vm7', semis: 7, step: 4, chord: 'm7', from: 'mixolidio', scale: 'dorico' },
  { roman: 'bVImaj7', semis: 8, step: 5, chord: 'maj7', from: 'eolico', scale: 'lidio' },
  { roman: 'bVII7', semis: 10, step: 6, chord: '7', from: 'eolico', scale: 'lidio-dom', note: 'Dominante "backdoor" (bVII7 → I).' },
  { roman: 'bVIImaj7', semis: 10, step: 6, chord: 'maj7', from: 'mixolidio', scale: 'lidio', note: 'También está en el dórico.' },
  { roman: 'bIImaj7', semis: 1, step: 1, chord: 'maj7', from: 'frigio', scale: 'lidio', note: 'Napolitano.' },
  { roman: 'bVIIm7', semis: 10, step: 6, chord: 'm7', from: 'frigio', scale: 'dorico' },
  { roman: 'IV7', semis: 5, step: 3, chord: '7', from: 'dorico', scale: 'mixolidio' },
  { roman: 'II7', semis: 2, step: 1, chord: '7', from: 'lidio', scale: 'mixolidio' },
  { roman: '#IVm7(b5)', semis: 6, step: 3, chord: 'm7b5', from: 'lidio', scale: 'locrio' },
  { roman: 'Im7', semis: 0, step: 0, chord: 'm7', from: 'eolico', scale: 'eolico' },
  { roman: 'Im(maj7)', semis: 0, step: 0, chord: 'mMaj7', from: 'menor-armonica', scale: 'menor-melodica' },
];
export const MODE_NAMES_FROM = { eolico: 'Eólico (menor natural)', dorico: 'Dórico', frigio: 'Frigio', lidio: 'Lidio', mixolidio: 'Mixolidio', locrio: 'Locrio', 'menor-armonica': 'Menor armónica' };

// Nota a una distancia (semitonos + paso de letra) desde la tónica escrita
export function fromTonic(tonic, semis, step) {
  const l = mod(tonic.l + step, 7);
  let a = mod(notePc(tonic) + semis - NAT[l]);
  if (a > 6) a -= 12;
  return note(l, a);
}
// Dominante (V7) de una nota escrita: una 5ta justa arriba
export const dominantOf = (n) => transpose(n, '5');
// Sustituto tritonal: dominante a un tritono (escrito como 5ta disminuida, o 4ta aumentada si queda más simple)
export function tritoneSub(n) {
  const a = transpose(n, 'b5');
  const b = transpose(n, '#4');
  return Math.abs(a.a) <= Math.abs(b.a) ? a : b;
}

// ---------------------------------------------------------------- improvisación (chord-scale)
// Opciones por tipo de acorde: escalas (la primera es la principal), pentatónicas y arpegios superpuestos.
export const IMPRO = {
  maj7: { scales: ['jonico', 'lidio', 'lidio-aum', 'penta-mayor'], tensions: ['9', '#11', '13'], avoid: ['11 (en Jónico)'] },
  '7': { scales: ['mixolidio', 'lidio-dom', 'mixolidio-b6', 'frigio-dom', 'alterada', 'dis-st', 'blues', 'blues-mayor', 'penta-mayor'], tensions: ['9', '13', 'b9', '#9', '#11', 'b13'], avoid: ['11 (con 3ra)'] },
  m7: { scales: ['dorico', 'eolico', 'frigio', 'penta-menor', 'blues', 'dorico-b2'], tensions: ['9', '11', '13'], avoid: ['b13 (Eólico)', 'b9 (Frigio)'] },
  m7b5: { scales: ['locrio', 'locrio-n2', 'locrio-n6'], tensions: ['9', '11', 'b13'], avoid: ['b9 (Locrio)'] },
  dim7: { scales: ['dis-ts', 'ultralocrio'], tensions: ['9', '11', 'b13', '7'], avoid: [] },
  mMaj7: { scales: ['menor-melodica', 'menor-armonica'], tensions: ['9', '11', '13'], avoid: [] },
  maj7s5: { scales: ['lidio-aum', 'jonico-s5'], tensions: ['9', '#11'], avoid: [] },
  mayor: { scales: ['jonico', 'lidio', 'mixolidio', 'penta-mayor'], tensions: ['9', '#11', '13'], avoid: [] },
  menor: { scales: ['dorico', 'eolico', 'frigio', 'menor-melodica', 'menor-armonica', 'penta-menor', 'blues'], tensions: ['9', '11', '13'], avoid: [] },
  dim: { scales: ['locrio', 'locrio-n2', 'dis-ts'], tensions: ['11', 'b13'], avoid: [] },
};

// Pentatónicas (mayores) cuyas 5 notas están dentro de una escala dada. Devuelve [{root pc, interval desde la tónica}]
export function pentatonicsIn(rootPc, intervals) {
  const set = new Set(intervals.map((iv) => mod(rootPc + ivSemis(iv))));
  const out = [];
  for (let r = 0; r < 12; r++) {
    if (['1', '2', '3', '5', '6'].every((iv) => set.has(mod(r + ivSemis(iv))))) out.push({ majorPc: r, minorPc: mod(r + 9) });
  }
  return out;
}
// Arpegios de 7ma construidos sobre cada grado de la escala y lo que aportan respecto del acorde
export function superimpositions(rootPc, intervals) {
  const ds = diatonic(intervals, true);
  return ds.map((d) => {
    const deg = d.deg;
    const tones = [0, 2, 4, 6].map((k) => intervals[(deg + k) % 7]);
    return { deg, chord: d.chord, rootIv: intervals[deg], tones: tones.map(toExt) };
  });
}
// 2 -> 9, 4 -> 11, 6 -> 13 (con sus alteraciones)
export function toExt(iv) {
  const { deg } = ivParse(iv);
  const acc = iv.replace(/\d+/, '');
  if (deg === 2) return acc + '9';
  if (deg === 4) return acc + '11';
  if (deg === 6) return acc + '13';
  return iv;
}

// ---------------------------------------------------------------- utilidades
export const rand = (n) => Math.floor(Math.random() * n);
export const pick = (a) => a[rand(a.length)];
export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
// Tónicas "razonables" (sin dobles alteraciones en la escala/acorde)
export function goodRoots(intervals, { naturalsOnly = false } = {}) {
  const out = [];
  for (let l = 0; l < 7; l++) for (const a of naturalsOnly ? [0] : [-1, 0, 1]) {
    const r = note(l, a);
    const notes = spellAll(r, intervals);
    if (notes.every((n) => Math.abs(n.a) <= 1)) out.push(r);
  }
  return out;
}
