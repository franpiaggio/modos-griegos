// Generadores de preguntas de cada ejercicio de teoría (todo calculado a partir de theory.js).
import {
  note, notePc, sameNote, transpose, transposeDown, ivParse, ivSemis, intervalBetween, intervalLong, idToFormula,
  SCALES, scaleById, CHORDS, chordById, spellAll, goodRoots, bestRoot, diatonic, MAJOR_FUNCTIONS, SECONDARY,
  BORROWED, fromTonic, dominantOf, superimpositions, toExt, pick, shuffle, rand, LATIN, LETTERS,
} from './theory.js';
import { N, NL } from './teoria-engine.js';
import { prefs } from './ui.js';
import * as audio from './audio.js';
import * as Gt from './guitar.js';

const BLACK = '#1E1E1E', GREY = '#6b6b75';

// ---------------------------------------------------------------- utilidades
const JON = scaleById('jonico').intervals;
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const okSpell = (list, allowDouble = false) => list.every((n) => Math.abs(n.a) <= (allowDouble ? 2 : 1));
// Cifrado: en Do Re Mi se separa con un espacio fino cuando el sufijo empieza con letra (Do m7, Re maj7, Mi7)
export function CH(root, chord) {
  const sym = typeof chord === 'string' ? chordById(chord).sym : chord.sym;
  return N(root) + (prefs.notation === 'latin' && /^[a-z]/i.test(sym) ? '\u2009' : '') + sym;
}
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
export function scaleLabel(s) {
  return { jonico: 'mayor', eolico: 'menor natural' }[s.id] || lc(s.name);
}
// Raíces: 'nat' = naturales; 'comunes' = con hasta una alteración y sin dobles alteraciones en el resultado
function roots(intervals, mode) {
  const iv = intervals.filter((x) => x !== 'bb7');
  return goodRoots(iv, { naturalsOnly: mode === 'nat' });
}
// Tonalidades mayores usadas en armonía (hasta 5 alteraciones; 'nat' = Do Re Mi Fa Sol La Si)
const KEY_NAMES = ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
const parseL = (s) => note(LETTERS.indexOf(s[0]), s[1] === 'b' ? -1 : s[1] === '#' ? 1 : 0);
function keys(mode) {
  const all = KEY_NAMES.map(parseL);
  return mode === 'nat' ? all.filter((n) => n.a === 0) : all;
}
// Alturas MIDI de una fórmula desde una fundamental escrita (registro medio)
export function midisOf(root, intervals, base = 48) {
  let r = base + notePc(root);
  if (r > base + 7) r -= 12;
  return intervals.map((iv) => r + ivParse(iv).semis);
}
const keyName = (k, type = 'mayor') => `${N(k)} ${type}`;
const letterRun = (a, deg) => Array.from({ length: deg }, (_, i) => (prefs.notation === 'latin' ? LATIN : LETTERS)[(a.l + i) % 7]).join(' ');
const TENSION_OPTS = ['b9', '9', '#9', '11', '#11', 'b13', '13'].map((t) => ({ id: t, label: t }));
const TONE_NAME = { 1: 'la fundamental', 3: 'la 3ra', 5: 'la 5ta', 7: 'la 7ma' };
// Por qué una nota es "a evitar": queda medio tono arriba de una nota del acorde (regla de Berklee)
function avoidWhy(ext, chordIntervals) {
  const s = ivSemis(ext);
  const tone = chordIntervals.find((iv) => (s - ivSemis(iv) + 12) % 12 === 1);
  if (tone) return `${ext}: queda medio tono arriba de ${TONE_NAME[ivParse(tone).deg]}`;
  if (ext === '13') return '13: forma un tritono con la 3ra menor (criterio Berklee; otros autores la aceptan)';
  return ext;
}
const choice = (opts, answer) => ({ kind: 'choice', options: opts, answer });
function uniqueBy(list, key) {
  const seen = new Set();
  return list.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; });
}

// ================================================================= 1. Intervalos
const BASIC_IV = ['2m', '2M', '3m', '3M', '4J', '5J', '6m', '6M', '7m', '7M', '8J'];
const EXTRA_IV = ['4A', '5d', '2A', '5A', '6A', '7d'];
const EAR = [['2m', 1], ['2M', 2], ['3m', 3], ['3M', 4], ['4J', 5], ['4A/5d', 6], ['5J', 7], ['6m', 8], ['6M', 9], ['7m', 10], ['7M', 11], ['8J', 12]];
const semisOfId = (id) => (id === '8J' ? 12 : ivSemis(idToFormula(id)));

export const intervalos = {
  title: 'Intervalos', group: 'Construcción',
  desc: 'Construir e identificar intervalos, también de oído.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['construir', 'Construir'], ['identificar', 'Identificar'], ['oido', 'De oído']] },
    { key: 'dir', label: 'Dirección', options: [['asc', 'Ascendente'], ['desc', 'Descendente'], ['ambas', 'Ambas']] },
    { key: 'nivel', label: 'Intervalos', options: [['basicos', 'Mayores, menores y justos'], ['todos', '+ aumentados y disminuidos']] },
    { key: 'raices', label: 'Notas de partida', options: [['nat', 'Naturales'], ['comunes', 'Con # y b']] },
  ],
  defaults: { tipo: ['construir', 'identificar'], dir: 'asc', nivel: 'basicos', raices: 'nat' },
  make(cfg) {
    const set = cfg.nivel === 'todos' ? [...BASIC_IV, ...EXTRA_IV] : BASIC_IV;
    return () => {
      const tipo = pick(cfg.tipo);
      const down = cfg.dir === 'desc' || (cfg.dir === 'ambas' && Math.random() < 0.5);
      const word = down ? 'descendente' : 'ascendente';
      if (tipo === 'oido') {
        const opts = cfg.nivel === 'todos' ? EAR : EAR.filter(([id]) => id !== '4A/5d');
        const [id, s] = pick(opts);
        const lo = 50 + rand(12);
        const pair = down ? [lo + s, lo] : [lo, lo + s];
        return {
          kicker: `De oído · ${word}`, prompt: '¿Qué intervalo suena?', listen: () => audio.playSeq(pair, { step: 0.7, dur: 0.8 }),
          listenButtons: [['Melódico', 'main'], ['Armónico', 'arm']], listenAlt: () => audio.playChord(pair, { strum: 0 }),
          ...choice(opts.map(([x]) => ({ id: x, label: x })), id),
          answerText: id, explain: () => `${id}: ${s} semitono${s > 1 ? 's' : ''}.`, sound: () => audio.playSeq(pair, { step: 0.6 }),
          neck: () => Gt.intervalShape(note(0), id === '8J' ? '8' : id === '4A/5d' ? '#4' : idToFormula(id), { s: 5 }), neckCap: () => `${id} es siempre la misma forma: ${s} trastes en una cuerda`,
        };
      }
      const id = pick(set);
      const f = idToFormula(id);
      const accs = cfg.raices === 'nat' ? [0] : [-1, 0, 0, 1];
      const a = note(rand(7), pick(accs));
      const b = down ? transposeDown(a, f) : transpose(a, f);
      if (!okSpell([b])) return null;
      const [lo, hi] = down ? [b, a] : [a, b];
      const deg = Number(id.match(/\d+/)[0]);
      const st = semisOfId(id);
      const m0 = 52 + notePc(lo);
      const pair = down ? [m0 + st, m0] : [m0, m0 + st];
      const explain = () => `${N(lo)}–${N(hi)}: ${deg === 8 ? 'misma letra una octava arriba' : `${deg} letras (${letterRun(lo, deg)})`} y ${st} semitonos → <b>${id}</b> (${intervalLong(id).toLowerCase()}).`;
      if (tipo === 'construir') {
        return {
          kicker: 'Construir intervalo', prompt: () => `<b>${id}</b> ${word} desde <b>${N(a)}</b>`, sub: intervalLong(id),
          kind: 'notes', slots: 1, ordered: true, answer: [b], answerText: () => N(b), explain, sound: () => audio.playSeq(pair),
          neck: () => Gt.answerNeck([lo, hi]), neckCap: () => `${st} trastes en la misma cuerda`,
        };
      }
      return {
        kicker: `Identificar · ${word}`, prompt: () => `<b>${N(a)}</b> ${down ? '↓' : '↑'} <b>${N(b)}</b>`, sub: down ? 'La segunda nota está abajo.' : 'La segunda nota está arriba.',
        ...choice(set.map((x) => ({ id: x, label: x })), id), answerText: id, explain, sound: () => audio.playSeq(pair),
        neck: () => Gt.answerNeck([lo, hi]), neckCap: () => `${st} trastes en la misma cuerda`,
      };
    };
  },
};

// ================================================================= 2. Escalas
const SCALE_SETS = {
  'penta-mayor': ['penta-mayor'], 'penta-menor': ['penta-menor'], jonico: ['jonico'], eolico: ['eolico'],
  'menor-armonica': ['menor-armonica'], 'menor-melodica': ['menor-melodica'],
  modos: ['dorico', 'frigio', 'lidio', 'mixolidio', 'locrio'], blues: ['blues', 'blues-mayor'],
};
export const escalas = {
  title: 'Armado de escalas', group: 'Construcción',
  desc: 'Escribir las notas de una escala desde su tónica.',
  settings: [
    { key: 'tipos', label: 'Escalas', multi: true, options: [['penta-mayor', 'Penta mayor'], ['penta-menor', 'Penta menor'], ['jonico', 'Mayor'], ['eolico', 'Menor natural'], ['menor-armonica', 'Menor armónica'], ['menor-melodica', 'Menor melódica'], ['modos', 'Modos griegos'], ['blues', 'Blues y penta mixolidia']] },
    { key: 'raices', label: 'Tónicas', options: [['nat', 'Naturales'], ['comunes', 'Todas (sin dobles alteraciones)']] },
  ],
  defaults: { tipos: ['penta-mayor', 'penta-menor', 'jonico', 'eolico', 'menor-armonica', 'menor-melodica'], raices: 'nat' },
  make(cfg) {
    const ids = cfg.tipos.flatMap((t) => SCALE_SETS[t]);
    return () => {
      const s = scaleById(pick(ids));
      const r = pick(roots(s.intervals, cfg.raices));
      if (!r) return null;
      const notes = spellAll(r, s.intervals);
      const midis = midisOf(r, [...s.intervals, '8'], 55);
      return {
        kicker: 'Armar escala', prompt: () => `<b>${N(r)} ${scaleLabel(s)}</b>`, sub: 'Escribí las notas en orden, desde la tónica.',
        kind: 'notes', slots: notes.length, given: [r], ordered: true, answer: notes,
        answerText: () => NL(notes),
        explain: () => `Fórmula ${s.intervals.join(' ')}. Una letra por grado${s.intervals.length < 7 ? ' (los grados que faltan se saltean)' : ''}: ${NL(notes)}.`,
        sound: () => audio.playSeq(midis, { step: 0.28, dur: 0.4 }),
        neck: () => Gt.position(r, s.intervals), neckCap: () => `${N(r)} ${scaleLabel(s)} en una posición, desde la tónica en negro`,
      };
    };
  },
};

// ================================================================= 3. Acordes
const CHORD_LEVELS = {
  triadas: ['mayor', 'menor', 'dim', 'aum', 'sus2', 'sus4'],
  septimas: ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7', 'maj7s5', '7s5', '7sus4', '6', 'm6'],
  ext: ['add9', '69', 'maj9', '9', 'm9', 'm11', 'maj7s11', '13', 'm7b9', '7s9'],
};
export const acordes = {
  title: 'Armado de acordes', group: 'Construcción',
  desc: 'Tríadas, cuatríadas y extensiones: armar e identificar.',
  settings: [
    { key: 'modo', label: 'Qué practicar', multi: true, options: [['armar', 'Armar (notas)'], ['identificar', 'Identificar (cifrado)']] },
    { key: 'niveles', label: 'Acordes', multi: true, options: [['triadas', 'Tríadas (M m ° + sus)'], ['septimas', 'Con 7ma y 6ta'], ['ext', 'Extensiones (9 11 13)']] },
    { key: 'raices', label: 'Fundamentales', options: [['nat', 'Naturales'], ['comunes', 'Todas (sin dobles alteraciones)']] },
  ],
  defaults: { modo: ['armar', 'identificar'], niveles: ['triadas', 'septimas'], raices: 'nat' },
  make(cfg) {
    const pool = cfg.niveles.flatMap((l) => CHORD_LEVELS[l]);
    return () => {
      const c = chordById(pick(pool));
      const r = pick(roots(c.intervals, cfg.raices));
      if (!r) return null;
      const notes = spellAll(r, c.intervals);
      if (!okSpell(notes, c.intervals.includes('bb7'))) return null;
      const midis = midisOf(r, c.intervals);
      const explain = () => `${CH(r, c)} (${c.name.toLowerCase()}): ${c.intervals.join(' ')} → ${NL(notes)}.${c.intervals.includes('bb7') ? ' La 7ma disminuida (bb7) se escribe con la letra de la 7ma aunque suene como la 6ta.' : ''}`;
      if (pick(cfg.modo) === 'armar') {
        return {
          kicker: 'Armar acorde', prompt: () => `<b>${CH(r, c)}</b>`, sub: `${c.name}: escribí sus ${notes.length} notas (en cualquier orden).`,
          kind: 'notes', slots: notes.length, given: [r], ordered: false, answer: notes, answerText: () => NL(notes), explain,
          sound: () => audio.playChord(midis), neck: () => Gt.chordNeck(r, c), neckCap: () => `arpegio de ${CH(r, c)} en una posición`,
        };
      }
      const others = shuffle(pool.filter((x) => x !== c.id)).slice(0, 5);
      const opts = shuffle([c.id, ...others]).map((id) => ({ id, label: () => CH(r, id) }));
      return {
        kicker: 'Identificar acorde', prompt: () => NL(notes), sub: `Fundamental: ${N(r)}. ¿Qué acorde es?`,
        ...choice(opts, c.id), answerText: () => CH(r, c), explain, sound: () => audio.playChord(midis),
        neck: () => Gt.chordNeck(r, c), neckCap: () => `arpegio de ${CH(r, c)} en una posición`,
      };
    };
  },
};

// ================================================================= 4. Grados y detección de escalas
const DETECT = {
  basico: ['jonico', 'eolico', 'menor-armonica', 'menor-melodica', 'penta-mayor', 'penta-menor', 'blues'],
  modos: ['jonico', 'dorico', 'frigio', 'lidio', 'mixolidio', 'eolico', 'locrio', 'menor-armonica', 'menor-melodica'],
};
export const grados = {
  title: 'Grados y escalas', group: 'Análisis',
  desc: 'Qué grado es cada nota y qué escala forma una secuencia.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['grado', 'Grado de una nota'], ['detectar', 'Detectar la escala'], ['tonalidad', 'Tonalidad de unos acordes']] },
    { key: 'escalas', label: 'Escalas a detectar', options: [['basico', 'Mayor, menores y pentas'], ['modos', 'Modos griegos y menores']] },
    { key: 'orden', label: 'Secuencia', options: [['ordenada', 'Ordenada'], ['desordenada', 'Desordenada']] },
    { key: 'raices', label: 'Tónicas', options: [['nat', 'Naturales'], ['comunes', 'Todas']] },
  ],
  defaults: { tipo: ['grado', 'detectar', 'tonalidad'], escalas: 'basico', orden: 'ordenada', raices: 'nat' },
  make(cfg) {
    return () => {
      const tipo = pick(cfg.tipo);
      if (tipo === 'grado') {
        const s = scaleById(pick(['jonico', 'jonico', 'eolico']));
        const k = pick(roots(s.intervals, cfg.raices));
        const notes = spellAll(k, s.intervals);
        const d = rand(7);
        const kName = () => `${N(k)} ${scaleLabel(s)}`;
        const midis = midisOf(k, s.intervals, 55);
        return {
          kicker: 'Grado', prompt: () => `En <b>${kName()}</b>, ¿qué grado es <b>${N(notes[d])}</b>?`,
          ...choice(ROM.map((x, i) => ({ id: String(i), label: x })), String(d)),
          answerText: () => `${ROM[d]} (${N(notes[d])})`,
          explain: () => notes.map((n, i) => `${ROM[i]} ${N(n)}`).join(' · '),
          sound: () => audio.playSeq([midis[0], midis[d]], { step: 0.6 }),
          neck: () => Gt.position(k, s.intervals, { label: 'iv', color: (iv) => (iv === s.intervals[d] ? Gt.ORANGE : iv === '1' ? BLACK : GREY) }), neckCap: () => `el grado ${ROM[d]} (${N(notes[d])}) en naranja, contado desde la tónica`,
        };
      }
      if (tipo === 'detectar') {
        const pool = DETECT[cfg.escalas];
        const s = scaleById(pick(pool));
        const r = pick(roots(s.intervals, cfg.raices));
        if (!r) return null;
        const notes = spellAll(r, s.intervals);
        let order = s.intervals.map((_, i) => i);
        if (cfg.orden === 'desordenada') order = [0, ...shuffle(order.slice(1))];
        const ivs = [...order.map((i) => s.intervals[i]), '8'];
        const seq = [...order.map((i) => notes[i]), r];
        const midis = midisOf(r, ivs, 55);
        const others = shuffle(pool.filter((x) => x !== s.id)).slice(0, 5);
        const opts = shuffle([s.id, ...others]).map((id) => ({ id, label: () => `${N(r)} ${scaleLabel(scaleById(id))}` }));
        return {
          kicker: 'Detectar escala', prompt: () => NL(seq), sub: `Empieza y termina en la tónica (${N(r)}). ¿Qué escala es?`,
          listen: () => audio.playSeq(midis, { step: 0.36, dur: 0.45 }),
          ...choice(opts, s.id), wide: true, answerText: () => `${N(r)} ${scaleLabel(s)}`,
          explain: () => `Intervalos desde ${N(r)}: ${s.intervals.join(' ')}${s.char ? ` · rasgo propio: ${s.char}` : ''}.`,
          sound: () => audio.playSeq(midisOf(r, [...s.intervals, '8'], 55), { step: 0.28 }),
          neck: () => Gt.position(r, s.intervals, { label: 'iv' }), neckCap: () => `${N(r)} ${scaleLabel(s)} con sus intervalos`,
        };
      }
      // tonalidad de un grupo de acordes: siempre incluye el V7 (único en cada tonalidad mayor)
      const k = pick(keys(cfg.raices));
      const ds = diatonic(JON);
      const degs = [4, ...shuffle([0, 1, 2, 3, 5]).slice(0, 2)];
      const chords = shuffle(degs).map((d) => ({ root: transpose(k, JON[d]), chord: ds[d].chord, d }));
      const near = uniqueBy([transpose(k, '5'), transpose(k, '4'), transpose(k, '2'), transposeDown(k, '2'), transpose(k, '6'), transpose(k, '3')].filter((n) => okSpell([n]) && notePc(n) !== notePc(k)), notePc).slice(0, 4);
      const opts = shuffle([k, ...near]).map((n) => ({ id: `${n.l}${n.a}`, label: () => keyName(n) }));
      return {
        kicker: 'Tonalidad', prompt: () => chords.map((c) => CH(c.root, c.chord)).join(' · '), sub: '¿A qué tonalidad mayor pertenecen?',
        ...choice(opts, `${k.l}${k.a}`), answerText: () => keyName(k),
        explain: () => `${chords.map((c) => `${CH(c.root, c.chord)} = ${ds[c.d].roman}`).join(', ')} en ${keyName(k)}. El acorde dominante (7) aparece una sola vez en cada tonalidad mayor: es el V7.`,
        sound: () => audio.playSeq(chords.map((c) => midisOf(c.root, c.chord.intervals)), { step: 0.9 }),
        neck: () => Gt.rootsNeck(k, [{ iv: '1', label: 'I', color: BLACK }, ...chords.filter((c) => c.d !== 0).map((c) => ({ iv: JON[c.d], label: ds[c.d].roman.replace(/(maj7|m7\(b5\)|m7|7)$/, ''), color: c.d === 4 ? '#CE3468' : GREY }))]), neckCap: () => `las fundamentales de estos acordes en la zona de ${keyName(k)}: la tónica (I) en negro y el V7 en rojo`,
      };
    };
  },
};

// ================================================================= 5. Oído funcional (cadencia + nota)
const FUNC_LEVELS = {
  '1-3': ['1', '2', '3'], '1-5': ['1', '2', '3', '4', '5'], diat: ['1', '2', '3', '4', '5', '6', '7'],
  crom: ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'],
};
const DIAT_SEMIS = [0, 2, 4, 5, 7, 9, 11];
// Enlace de voces de la cadencia I-IV-V-I (semitonos desde la tónica)
const CADENCE = [[-12, 4, 7, 12], [-7, 5, 9, 12], [-5, 2, 7, 11], [-12, 4, 7, 12]];
function playCadence(T, then) {
  const ctx = audio.getCtx();
  const t0 = ctx.currentTime + 0.05;
  CADENCE.forEach((c, i) => audio.chordAt(c.map((x) => T + x), t0 + i * 0.75, 0.9, 0.012, 0.4));
  if (then != null) audio.noteAt(then, t0 + 4 * 0.75 + 0.35, 1.1, 0.95);
}
// Resolución melódica a la tónica más cercana (como Functional Ear Trainer)
function resolution(T, semis) {
  const path = [T + semis];
  let s = semis % 12;
  if (!DIAT_SEMIS.includes(s)) { s -= 1; path.push(T + s + (semis >= 12 ? 12 : 0)); }
  let i = DIAT_SEMIS.indexOf(s);
  const base = semis >= 12 ? T + 12 : T;
  if (semis >= 12) return path;
  if (i <= 3) while (i > 0) { i -= 1; path.push(base + DIAT_SEMIS[i]); }
  else { while (i < 6) { i += 1; path.push(base + DIAT_SEMIS[i]); } path.push(base + 12); }
  return path;
}
export const oido = {
  title: 'Oído funcional', group: 'Análisis',
  desc: 'Escuchá una cadencia y reconocé el grado de la nota.',
  settings: [
    { key: 'nivel', label: 'Grados', options: [['1-3', '1 a 3'], ['1-5', '1 a 5'], ['diat', 'Diatónicos (1 a 7)'], ['crom', 'Cromáticos (12)']] },
    { key: 'tono', label: 'Tonalidad', options: [['fija', 'Siempre Do'], ['variable', 'Cambia en cada pregunta']] },
  ],
  defaults: { nivel: '1-3', tono: 'fija' },
  make(cfg) {
    const degs = FUNC_LEVELS[cfg.nivel];
    return () => {
      const pc = cfg.tono === 'fija' ? 0 : rand(12);
      const T = 55 + ((pc + 5) % 12); // tónica entre Sol3 y Fa#4
      const k = bestRoot(pc, JON);
      const d = pick(degs);
      let semis = ivSemis(d);
      if (d === '1' && Math.random() < 0.4) semis = 12;
      const target = T + semis;
      const noteSp = transpose(k, d);
      return {
        kicker: `Oído funcional · ${keyName(k)}`, prompt: '¿Qué grado es la nota?', sub: 'Primero suena la cadencia I–IV–V–I y después la nota.',
        listen: () => playCadence(T, target), listenButtons: [['Cadencia + nota', 'main'], ['Solo la nota', 'nota']],
        listenAlt: () => audio.noteAt(target, audio.getCtx().currentTime + 0.05, 1.1, 0.95),
        ...choice(degs.map((x) => ({ id: x, label: x })), d),
        answerText: () => `${d} (${N(noteSp)} en ${keyName(k)})`,
        explain: () => `Resolución: ${d === '1' ? 'ya es la tónica' : 'la nota se mueve por grados hasta la tónica más cercana'}.`,
        sound: () => audio.playSeq(resolution(T, semis), { step: 0.42, dur: 0.5 }),
        neck: () => Gt.position(k, JON.includes(d) ? JON : [...JON, d], { label: 'iv', color: (iv) => (iv === d ? Gt.ORANGE : iv === '1' ? BLACK : GREY) }), neckCap: () => `el ${d} de ${keyName(k)} en naranja: buscalo y resolvelo a la tónica`,
      };
    };
  },
};

// ================================================================= 6. Funciones y acordes extendidos
const KEY_TYPES = { mayor: ['jonico', 'mayor'], armonica: ['menor-armonica', 'menor armónica'], melodica: ['menor-melodica', 'menor melódica'] };
const EXTENDED_BY_FUNCTION = [
  ['Imaj9', 0, 'maj9'], ['IIm9', 1, 'm9'], ['IIm11', 1, 'm11'], ['IVmaj7(#11)', 3, 'maj7s11'],
  ['V9', 4, '9'], ['V13', 4, '13'], ['VIm9', 5, 'm9'], ['VIm11', 5, 'm11'],
];
export const funciones = {
  title: 'Acordes por función', group: 'Armonía',
  desc: 'Acordes diatónicos, tensiones disponibles y notas a evitar.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['cifrar', 'Cifrar un grado'], ['grado', 'Reconocer el grado'], ['tensiones', 'Tensiones disponibles'], ['evitar', 'Notas a evitar'], ['extendido', 'Armar acorde extendido']] },
    { key: 'tonos', label: 'Tonalidades (cifrar/grado)', multi: true, options: [['mayor', 'Mayor'], ['armonica', 'Menor armónica'], ['melodica', 'Menor melódica']] },
    { key: 'raices', label: 'Tónicas', options: [['nat', 'Naturales'], ['comunes', 'Hasta 5 alteraciones']] },
  ],
  defaults: { tipo: ['cifrar', 'grado', 'tensiones', 'evitar', 'extendido'], tonos: ['mayor'], raices: 'nat' },
  make(cfg) {
    return () => {
      const tipo = pick(cfg.tipo);
      if (tipo === 'cifrar' || tipo === 'grado') {
        const [sid, tname] = KEY_TYPES[pick(cfg.tonos)];
        const s = scaleById(sid);
        const k = pick(roots(s.intervals, cfg.raices === 'nat' ? 'nat' : 'comunes'));
        const ds = diatonic(s.intervals);
        const all = ds.map((d) => ({ ...d, root: transpose(k, s.intervals[d.deg]) }));
        if (!all.every((c) => okSpell(spellAll(c.root, c.chord.intervals), c.chord.id === 'dim7'))) return null;
        const d = all[rand(7)];
        const kn = () => keyName(k, tname);
        const sound = () => audio.playChord(midisOf(d.root, d.chord.intervals));
        const explain = () => all.map((c) => `${c.roman} ${CH(c.root, c.chord)}`).join(' · ');
        if (tipo === 'cifrar') {
          return {
            kicker: 'Cifrar', prompt: () => `En <b>${kn()}</b>, ¿cuál es el <b>${d.roman}</b>?`,
            ...choice(all.map((c) => ({ id: String(c.deg), label: () => CH(c.root, c.chord) })), String(d.deg)),
            answerText: () => CH(d.root, d.chord), explain, sound,
            neck: () => Gt.chordNeck(d.root, d.chord), neckCap: () => `${CH(d.root, d.chord)} (${d.roman}) en una posición`,
          };
        }
        return {
          kicker: 'Grado', prompt: () => `En <b>${kn()}</b>, <b>${CH(d.root, d.chord)}</b> es el…`,
          ...choice(all.map((c) => ({ id: String(c.deg), label: c.roman })), String(d.deg)),
          answerText: d.roman, explain, sound,
          neck: () => Gt.chordNeck(d.root, d.chord), neckCap: () => `${CH(d.root, d.chord)} (${d.roman}) en una posición`,
        };
      }
      const k = pick(keys(cfg.raices));
      if (tipo === 'extendido') {
        const [rom, deg, cid] = pick(EXTENDED_BY_FUNCTION);
        const c = chordById(cid);
        const r = transpose(k, JON[deg]);
        const notes = spellAll(r, c.intervals);
        if (!okSpell(notes)) return null;
        return {
          kicker: 'Acorde extendido', prompt: () => `En <b>${keyName(k)}</b>, armá el <b>${rom}</b>`, sub: `${notes.length} notas, en cualquier orden. Todas son diatónicas.`,
          kind: 'notes', slots: notes.length, given: [r], ordered: false, answer: notes, answerText: () => `${CH(r, c)}: ${NL(notes)}`,
          explain: () => `${rom} = ${CH(r, c)} (${c.intervals.join(' ')}).${cid === '13' ? ' En el 13 se omite la 11 (choca con la 3ra).' : ''}`,
          sound: () => audio.playChord(midisOf(r, c.intervals)), neck: () => Gt.chordNeck(r, c), neckCap: () => `${CH(r, c)}: las extensiones en violeta`,
        };
      }
      const pool = tipo === 'evitar' ? MAJOR_FUNCTIONS.filter((f) => f.avoid.length && f.roman !== 'IIm7') : MAJOR_FUNCTIONS;
      const f = pick(pool);
      const c = chordById(f.chord);
      const r = transpose(k, JON[f.deg]);
      const sc = scaleById(f.scale);
      const ctxt = () => `${CH(r, c)} en ${keyName(k)}`;
      const explain = () => `${f.roman} → ${sc.name}. Tensiones: ${f.tensions.join(', ')}. ${f.avoid.length ? `A evitar: ${f.avoid.map((a) => avoidWhy(a, c.intervals)).join('; ')}.` : 'Sin notas a evitar.'}${f.note ? ` ${f.note}` : ''}`;
      const sound = () => audio.playSeq(midisOf(r, [...sc.intervals, '8'], 55), { step: 0.25 });
      if (tipo === 'tensiones') {
        return {
          kicker: 'Tensiones disponibles', prompt: () => `<b>${f.roman}</b> en tonalidad mayor`, sub: () => `Ej.: ${ctxt()}. Escala: ${sc.name}.`,
          kind: 'multi', options: TENSION_OPTS, answer: f.tensions, answerText: f.tensions.join(', '), explain, sound,
          neck: () => Gt.scaleOnChord(r, sc, c, f.avoid), neckCap: () => `${N(r)} ${sc.name.toLowerCase()} sobre ${CH(r, c)}: tensiones en violeta, a evitar en gris claro`,
          check: (sel) => {
            const s = new Set(sel);
            const eq = (arr) => arr.length === s.size && arr.every((x) => s.has(x));
            if (eq(f.tensions)) return { ok: true };
            if (f.roman === 'IIm7' && eq(['9', '11', '13'])) return { ok: true, msg: 'Válido: Berklee evita la 13 en el IIm7, pero muchos autores la usan.' };
            return { ok: false };
          },
        };
      }
      return {
        kicker: 'Notas a evitar', prompt: () => `<b>${f.roman}</b> en tonalidad mayor`, sub: () => `Ej.: ${ctxt()}. Escala: ${sc.name}. ¿Qué nota(s) se evitan?`,
        kind: 'multi', options: TENSION_OPTS, answer: f.avoid, answerText: f.avoid.join(', '), explain, sound,
        neck: () => Gt.scaleOnChord(r, sc, c, f.avoid), neckCap: () => `${N(r)} ${sc.name.toLowerCase()} sobre ${CH(r, c)}: a evitar en gris claro`,
      };
    };
  },
};

// ================================================================= 7. Extensiones de arpegios (superposición)
const SUP_CTX = [['maj7', 'jonico', ['11']], ['m7', 'dorico', []], ['7', 'mixolidio', ['11']], ['m7b5', 'locrio', ['b9']]];
const DEG_WORD = { 2: '3ra', 4: '5ta', 6: '7ma' };
const ARP_EXT = ['maj9', '9', 'm9', '13', 'm11', 'm7b9', '7s9', '69', 'maj7s11'];
export const extensiones = {
  title: 'Extensiones de arpegios', group: 'Armonía',
  desc: 'Qué agrega un arpegio superpuesto y cómo se arma uno extendido.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['aporte', 'Qué aporta un arpegio'], ['cual', 'Qué arpegio usar'], ['armar', 'Armar arpegio extendido']] },
    { key: 'raices', label: 'Fundamentales', options: [['nat', 'Naturales'], ['comunes', 'Todas']] },
  ],
  defaults: { tipo: ['aporte', 'cual', 'armar'], raices: 'nat' },
  make(cfg) {
    return () => {
      const tipo = pick(cfg.tipo);
      if (tipo === 'armar') {
        const c = chordById(pick(ARP_EXT));
        const r = pick(roots(c.intervals, cfg.raices));
        if (!r) return null;
        const notes = spellAll(r, c.intervals);
        return {
          kicker: 'Arpegio extendido', prompt: () => `Arpegio de <b>${CH(r, c)}</b>`, sub: 'Escribí las notas en orden de la fórmula (1 3 5 7 9…).',
          kind: 'notes', slots: notes.length, given: [r], ordered: true, answer: notes, answerText: () => NL(notes),
          explain: () => `${c.intervals.join(' ')} → ${NL(notes)}. La 9 es la 2 una octava arriba, la 11 la 4 y la 13 la 6.`,
          sound: () => audio.playSeq(midisOf(r, c.intervals), { step: 0.3 }),
          neck: () => Gt.chordNeck(r, c), neckCap: () => `arpegio de ${CH(r, c)}: las extensiones en violeta`,
        };
      }
      const [cid, sid, avoid] = pick(SUP_CTX);
      const c = chordById(cid);
      const sc = scaleById(sid);
      const r = pick(roots(sc.intervals, cfg.raices));
      if (!r) return null;
      const sups = superimpositions(notePc(r), sc.intervals).map((x) => ({ ...x, root: transpose(r, sc.intervals[x.deg]), label: x.tones.join('-') }));
      const deg = pick([2, 4, 6]);
      const sup = sups[deg];
      const bad = sup.tones.filter((t) => avoid.includes(t));
      const explain = () => `${CH(sup.root, sup.chord)} = ${NL(spellAll(sup.root, sup.chord.intervals))}: sobre ${CH(r, c)} son ${sup.tones.join(', ')} (escala ${sc.name}).${bad.length ? ` Ojo: incluye ${bad.join(', ')}, nota a evitar sobre ${CH(r, c)}.` : ''}`;
      const sound = () => audio.playSeq([midisOf(r, c.intervals), ...midisOf(sup.root, sup.chord.intervals, 55)], { step: 0.32 });
      const neck = () => Gt.overlay(r, c.intervals, sup.root, sup.chord.intervals, { labelB: sup.tones, colorB: '#8E4CC0' });
      const neckCap = () => `${CH(r, c)} en una posición; los números muestran qué es cada nota de ${CH(sup.root, sup.chord)} sobre ${CH(r, c)}, y en contorno las que no están en el acorde`;
      if (tipo === 'aporte') {
        const opts = uniqueBy(shuffle([sup, ...shuffle(sups.filter((x) => x.deg !== deg)).slice(0, 4)]), (x) => x.label);
        return {
          kicker: 'Superposición', prompt: () => `Sobre <b>${CH(r, c)}</b> tocás el arpegio de <b>${CH(sup.root, sup.chord)}</b>`, sub: '¿Qué grados del acorde suenan?',
          ...choice(opts.map((x) => ({ id: x.label, label: x.label })), sup.label), answerText: sup.label, explain, sound, neck, neckCap,
        };
      }
      return {
        kicker: 'Superposición', prompt: () => `Sobre <b>${CH(r, c)}</b>, ¿qué arpegio desde su <b>${DEG_WORD[deg]}</b> da <b>${sup.label}</b>?`, sub: `Escala: ${sc.name}.`,
        ...choice(sups.map((x) => ({ id: String(x.deg), label: () => CH(x.root, x.chord) })), String(deg)),
        answerText: () => CH(sup.root, sup.chord), explain, sound, neck, neckCap,
      };
    };
  },
};

// ================================================================= 8. Dominantes secundarios
const secLabel = (s) => s.id.replace('V/', 'V7/');
const SCALE_OPTS_DOM = ['mixolidio', 'mixolidio-b6', 'frigio-dom', 'lidio-dom', 'alterada', 'dorico'];
export const secundarios = {
  title: 'Dominantes secundarios', group: 'Armonía',
  desc: 'V7 de cada grado: cifrado, resolución, tensiones y escala.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['cifrar', 'Cifrar (V7/x)'], ['armar', 'Armar notas'], ['identificar', 'Reconocer'], ['resuelve', 'Resolución'], ['tensiones', 'Tensiones'], ['escala', 'Escala']] },
    { key: 'raices', label: 'Tonalidades', options: [['nat', 'Naturales'], ['comunes', 'Hasta 5 alteraciones']] },
  ],
  defaults: { tipo: ['cifrar', 'armar', 'identificar', 'resuelve', 'tensiones', 'escala'], raices: 'nat' },
  make(cfg) {
    return () => {
      const tipo = pick(cfg.tipo);
      const k = pick(keys(cfg.raices));
      const ds = diatonic(JON).map((d) => ({ ...d, root: transpose(k, JON[d.deg]) }));
      const secs = SECONDARY.map((s) => ({ ...s, root: dominantOf(ds[s.target].root) }));
      const s = pick(secs);
      const dom = chordById('7');
      const notes = spellAll(s.root, dom.intervals);
      if (!okSpell(notes)) return null;
      const t = ds[s.target];
      const sc = scaleById(s.scale);
      const kn = () => keyName(k);
      const sound = () => audio.playSeq([midisOf(s.root, dom.intervals), midisOf(t.root, t.chord.intervals)], { step: 1 });
      const neck = () => Gt.overlay(s.root, dom.intervals, t.root, t.chord.intervals, { guides: [['3', '1']] });
      const neckCap = () => `relleno: ${CH(s.root, '7')}; contorno: ${CH(t.root, t.chord)}, al que resuelve. La 3ra de ${CH(s.root, '7')} sube un traste`;
      const explain = () => `${secLabel(s)} = ${CH(s.root, '7')} (${NL(notes)}): dominante de ${CH(t.root, t.chord)} (${t.roman}), una 5ta justa arriba. Escala: ${sc.name}; tensiones ${s.tensions.join(', ')}${s.note ? ` (${s.note})` : ''}.`;
      if (tipo === 'cifrar') {
        const opts = [...secs, { id: 'V', root: ds[4].root }].map((x) => ({ id: `${x.root.l}${x.root.a}`, label: () => CH(x.root, '7') }));
        return { kicker: 'Cifrar', prompt: () => `En <b>${kn()}</b>, ¿cuál es el <b>${secLabel(s)}</b>?`, ...choice(shuffle(opts), `${s.root.l}${s.root.a}`), answerText: () => CH(s.root, '7'), explain, sound, neck, neckCap };
      }
      if (tipo === 'armar') {
        return { kicker: 'Armar', prompt: () => `En <b>${kn()}</b>, escribí las notas del <b>${secLabel(s)}</b>`, sub: '4 notas, en cualquier orden.', kind: 'notes', slots: 4, ordered: false, answer: notes, answerText: () => `${CH(s.root, '7')}: ${NL(notes)}`, explain, sound, neck, neckCap };
      }
      if (tipo === 'identificar') {
        const opts = [...SECONDARY.map((x) => ({ id: x.id, label: secLabel(x) })), { id: 'V', label: 'V7 (primario)' }];
        return { kicker: 'Reconocer', prompt: () => `En <b>${kn()}</b>, <b>${CH(s.root, '7')}</b> es el…`, ...choice(opts, s.id), answerText: secLabel(s), explain, sound, neck, neckCap };
      }
      if (tipo === 'resuelve') {
        return { kicker: 'Resolución', prompt: () => `En <b>${kn()}</b>, <b>${CH(s.root, '7')}</b> resuelve en…`, ...choice(ds.slice(0, 6).map((d) => ({ id: String(d.deg), label: () => CH(d.root, d.chord) })), String(s.target)), answerText: () => `${CH(t.root, t.chord)} (${t.roman})`, explain, sound, neck, neckCap };
      }
      if (tipo === 'tensiones') {
        return {
          kicker: 'Tensiones', prompt: () => `Tensiones disponibles del <b>${secLabel(s)}</b>`, sub: () => `Ej.: ${CH(s.root, '7')} en ${kn()}. Salen de las notas diatónicas de la tonalidad.`,
          kind: 'multi', options: TENSION_OPTS, answer: s.tensions, answerText: s.tensions.join(', '), explain, sound, neck, neckCap,
          check: (sel) => {
            const set = new Set(sel);
            const eq = (arr) => arr.length === set.size && arr.every((x) => set.has(x));
            if (eq(s.tensions)) return { ok: true };
            if (s.id === 'V/VI' && eq([...s.tensions, '#9'])) return { ok: true, msg: 'Válido: algunos autores agregan #9 (la 3ra del acorde de tónica).' };
            return { ok: false };
          },
        };
      }
      const opts = SCALE_OPTS_DOM.filter((x) => !(s.id === 'V/III' && x === 'alterada')).map((id) => ({ id, label: scaleById(id).name }));
      return { kicker: 'Escala', prompt: () => `¿Qué escala corresponde al <b>${secLabel(s)}</b> en tonalidad mayor?`, sub: () => `Ej.: ${CH(s.root, '7')} en ${kn()}.`, ...choice(opts, s.scale), answerText: sc.name, explain, sound, neck, neckCap };
    };
  },
};

// ================================================================= 9. Sustitución tritonal
export const tritono = {
  title: 'Sustitución tritonal', group: 'Armonía',
  desc: 'El subV7: cifrado, tritono compartido y escala.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['subv', 'subV7 de un dominante'], ['tritono', 'Tritono compartido'], ['tonalidad', 'subV7 en una tonalidad'], ['escala', 'Escala']] },
    { key: 'raices', label: 'Tonalidades', options: [['nat', 'Naturales'], ['comunes', 'Hasta 5 alteraciones']] },
  ],
  defaults: { tipo: ['subv', 'tritono', 'tonalidad', 'escala'], raices: 'nat' },
  make(cfg) {
    return () => {
      const tipo = pick(cfg.tipo);
      const k = pick(keys(cfg.raices));
      const ds = diatonic(JON).map((d) => ({ ...d, root: transpose(k, JON[d.deg]) }));
      const tdeg = tipo === 'tonalidad' ? rand(6) : 0;
      const target = ds[tdeg];
      const V = dominantOf(target.root);
      const sub = transpose(target.root, 'b2'); // medio tono arriba del acorde de resolución
      const vNotes = spellAll(V, chordById('7').intervals);
      const sNotes = spellAll(sub, chordById('7').intervals);
      if (!okSpell([...vNotes, sub, sNotes[1]])) return null;
      const lab = tdeg === 0 ? 'subV7' : `subV7/${ROM[tdeg]}`;
      const sound = () => audio.playSeq([midisOf(sub, ['1', '3', '5', 'b7']), midisOf(target.root, target.chord.intervals)], { step: 1 });
      const neck = () => Gt.tritoneNeck(V, sub);
      const neckCap = () => `${CH(V, '7')} y ${CH(sub, '7')} con 7ma y 3ra arriba: comparten esas dos notas; el bajo pasa a la 5ta cuerda, un traste adelante`;
      const explain = () => `${CH(sub, '7')} reemplaza a ${CH(V, '7')}: sus raíces están a un tritono y comparten el tritono ${N(vNotes[1])}–${N(vNotes[3])} (en ${CH(sub, '7')}: ${N(sNotes[1])}–${N(sNotes[3])}). Resuelve bajando medio tono a ${CH(target.root, target.chord)}. Escala: Lidio dominante (9, #11, 13), mismas notas que ${N(V)} alterada.`;
      if (tipo === 'subv' || tipo === 'tonalidad') {
        const cands = uniqueBy([sub, V, transpose(V, 'b2'), transpose(V, '4'), transpose(target.root, '2'), transpose(V, 'b7')].filter((n) => okSpell([n])), notePc);
        const opts = shuffle(cands.slice(0, 5)).map((n) => ({ id: `${n.l}${n.a}`, label: () => CH(n, '7') }));
        const prompt = tipo === 'subv' ? () => `¿Cuál es el subV7 de <b>${CH(V, '7')}</b>?` : () => `En <b>${keyName(k)}</b>, ¿cuál es el <b>${lab}</b>?`;
        return { kicker: 'Sustituto tritonal', prompt, sub: tipo === 'subv' ? () => `${CH(V, '7')} resuelve en ${CH(target.root, target.chord)}.` : '', ...choice(opts, `${sub.l}${sub.a}`), answerText: () => CH(sub, '7'), explain, sound, neck, neckCap };
      }
      if (tipo === 'tritono') {
        const want = [vNotes[1], vNotes[3]];
        const alt = [sNotes[3], sNotes[1]];
        return {
          kicker: 'Tritono compartido', prompt: () => `¿Qué tritono comparten <b>${CH(V, '7')}</b> y <b>${CH(sub, '7')}</b>?`, sub: '2 notas: la 3ra y la 7ma de cada acorde.',
          kind: 'notes', slots: 2, ordered: false, answer: want, answerText: () => `${NL(want)} (= ${NL(alt)})`, explain, sound, neck, neckCap,
          check: (resp) => {
            const has = (list) => list.every((w) => resp.some((n) => sameNote(n, w)));
            if (has(want) || has(alt)) return { ok: true };
            if (resp.map(notePc).sort().join() === want.map(notePc).sort().join()) return { ok: false, msg: 'Suenan bien, pero escribilas como 3ra y 7ma de uno de los dos acordes.' };
            if (resp.some((n) => sameNote(n, want[0]) || sameNote(n, want[1])) && resp.some((n) => sameNote(n, alt[0]))) return { ok: true, msg: `Válido: ${N(alt[0])} y ${N(want[0])} son la misma altura (enarmonía).` };
            return { ok: false };
          },
        };
      }
      const opts = ['lidio-dom', 'mixolidio', 'alterada', 'frigio-dom', 'dorico', 'lidio'].map((id) => ({ id, label: scaleById(id).name }));
      return { kicker: 'Escala', prompt: () => `¿Qué escala se usa sobre el subV7?`, sub: () => `Ej.: ${CH(sub, '7')} → ${CH(target.root, target.chord)}.`, ...choice(opts, 'lidio-dom'), answerText: 'Lidio dominante', explain, sound, neck, neckCap };
    };
  },
};

// ================================================================= 10. Intercambio modal
const MODES_SRC = ['dorico', 'frigio', 'lidio', 'mixolidio', 'eolico', 'locrio', 'menor-armonica'];
// Opciones de escala que algunos autores también aceptan (se quitan de las alternativas para no tener dos correctas)
const ALSO_OK = { 'bVII7': 'mixolidio', 'Vm7': 'frigio', 'bIIImaj7': 'jonico', 'IVm6': 'menor-melodica', 'Im7': 'dorico', 'Im(maj7)': 'menor-armonica' };
export const intercambio = {
  title: 'Intercambio modal', group: 'Armonía',
  desc: 'Acordes prestados de los modos paralelos.',
  settings: [
    { key: 'tipo', label: 'Qué practicar', multi: true, options: [['armar', 'Cifrar el prestado'], ['origen', 'De qué modo viene'], ['cual', 'Cuál es prestado'], ['escala', 'Escala']] },
    { key: 'raices', label: 'Tonalidades', options: [['nat', 'Naturales'], ['comunes', 'Hasta 5 alteraciones']] },
  ],
  defaults: { tipo: ['armar', 'origen', 'cual', 'escala'], raices: 'nat' },
  make(cfg) {
    return () => {
      const tipo = pick(cfg.tipo);
      const k = pick(keys(cfg.raices));
      const b = pick(BORROWED);
      const c = chordById(b.chord);
      const r = fromTonic(k, b.semis, b.step);
      const notes = spellAll(r, c.intervals);
      if (!okSpell([r, ...notes])) return null;
      const pcs = notes.map(notePc);
      const contains = (sid) => { const set = new Set(spellAll(k, scaleById(sid).intervals).map(notePc)); return pcs.every((p) => set.has(p)); };
      const sources = MODES_SRC.filter(contains);
      const modeLabel = (sid) => `${N(k)} ${scaleLabel(scaleById(sid))}`;
      const sc = scaleById(b.scale);
      const ds = diatonic(JON).map((d) => ({ ...d, root: transpose(k, JON[d.deg]) }));
      const sound = () => audio.playSeq([midisOf(k, ['1', '3', '5', '7']), midisOf(r, c.intervals)], { step: 1 });
      const neck = () => Gt.chordNeck(r, c);
      const neckCap = () => `${CH(r, c)} (${b.roman} prestado) en una posición`;
      const explain = () => `${b.roman} = ${CH(r, c)} (${NL(notes)}), tomado de ${N(k)} ${scaleLabel(scaleById(b.from))}${sources.length > 1 ? ` (también está en ${sources.filter((x) => x !== b.from).map(modeLabel).join(', ')})` : ''}. Escala sugerida: ${sc.name}.${b.note ? ` ${b.note}` : ''}`;
      if (tipo === 'armar') {
        const same = ds[b.step];
        const cands = uniqueBy([{ r, c }, { r: same.root, c: same.chord }, ...['maj7', 'm7', '7', 'm7b5', 'm6'].map((id) => ({ r, c: chordById(id) }))], (x) => `${x.r.l}${x.r.a}${x.c.id}`)
          .filter((x) => !(x.r.l === r.l && x.r.a === r.a && x.c.id === c.id) || x === undefined);
        const opts = shuffle([{ r, c }, ...shuffle(cands).slice(0, 4)]).map((x) => ({ id: `${x.r.l}${x.r.a}${x.c.id}`, label: () => CH(x.r, x.c) }));
        return { kicker: 'Acorde prestado', prompt: () => `En <b>${keyName(k)}</b>, ¿cuál es el <b>${b.roman}</b>?`, sub: 'Acorde prestado de un modo paralelo.', ...choice(opts, `${r.l}${r.a}${c.id}`), answerText: () => CH(r, c), explain, sound, neck, neckCap };
      }
      if (tipo === 'origen') {
        const wrong = shuffle(MODES_SRC.filter((x) => !sources.includes(x))).slice(0, 4);
        const extra = sources.filter((x) => x !== b.from).slice(0, 1);
        const opts = shuffle([b.from, ...extra, ...wrong]).map((id) => ({ id, label: () => modeLabel(id) }));
        return {
          kicker: 'Origen', prompt: () => `En <b>${keyName(k)}</b>, <b>${CH(r, c)}</b> (${b.roman}) viene de…`, wide: true,
          ...choice(opts, b.from), answerText: () => sources.map(modeLabel).join(' o '), explain, sound, neck, neckCap,
          check: (id) => ({ ok: sources.includes(id) }),
        };
      }
      if (tipo === 'cual') {
        const dia = shuffle(ds.slice(0, 6)).slice(0, 3);
        const opts = shuffle([{ id: 'b', label: () => CH(r, c) }, ...dia.map((d) => ({ id: String(d.deg), label: () => CH(d.root, d.chord) }))]);
        return { kicker: 'Prestado', prompt: () => `En <b>${keyName(k)}</b>, ¿cuál de estos acordes es prestado?`, ...choice(opts, 'b'), answerText: () => CH(r, c), explain, sound, neck, neckCap };
      }
      const pool = ['dorico', 'lidio', 'lidio-dom', 'locrio-n2', 'mixolidio', 'eolico', 'locrio', 'menor-melodica', 'jonico', 'frigio'].filter((x) => x !== b.scale && x !== ALSO_OK[b.roman]);
      const opts = shuffle([b.scale, ...shuffle(pool).slice(0, 4)]).map((id) => ({ id, label: scaleById(id).name }));
      return { kicker: 'Escala', prompt: () => `Sobre <b>${b.roman}</b> prestado (${CH(r, c)} en ${keyName(k)}), ¿qué escala corresponde?`, ...choice(opts, b.scale), answerText: sc.name, explain, sound, neck, neckCap };
    };
  },
};

// ================================================================= 11. Improvisación: contextos y quiz
// Devuelve la lista de contextos posibles en una tonalidad mayor: diatónicos, secundarios, subV y prestados.
export function contexts(k) {
  const ds = diatonic(JON).map((d) => ({ ...d, root: transpose(k, JON[d.deg]) }));
  const out = [];
  MAJOR_FUNCTIONS.forEach((f) => out.push({ group: 'Diatónicos', id: `d${f.deg}`, label: f.roman, fn: f.fn, root: ds[f.deg].root, chord: chordById(f.chord), scale: f.scale, alt: f.alt, tensions: f.tensions, avoid: f.avoid, note: f.note }));
  SECONDARY.forEach((s) => {
    const t = ds[s.target];
    out.push({ group: 'Dominantes secundarios', id: `s${s.target}`, label: secLabel(s), fn: `Dominante de ${t.roman}`, root: dominantOf(t.root), chord: chordById('7'), scale: s.scale, alt: ['alterada', 'dis-st'], tensions: s.tensions, avoid: ['11'], note: s.note });
  });
  [0, 1, 4, 5].forEach((d) => {
    const t = ds[d];
    out.push({ group: 'Sustitutos tritonales', id: `t${d}`, label: d === 0 ? 'subV7' : `subV7/${ROM[d]}`, fn: `Resuelve medio tono abajo en ${t.roman}`, root: transpose(t.root, 'b2'), chord: chordById('7'), scale: 'lidio-dom', alt: [], tensions: ['9', '#11', '13'], avoid: [] });
  });
  BORROWED.forEach((b, i) => out.push({ group: 'Intercambio modal', id: `b${i}`, label: b.roman, fn: `Prestado del ${scaleById(b.from).name.toLowerCase()}`, root: fromTonic(k, b.semis, b.step), chord: chordById(b.chord), scale: b.scale, alt: ALSO_OK[b.roman] ? [ALSO_OK[b.roman]] : [], tensions: null, avoid: null, note: b.note }));
  return out;
}
// Tensiones y notas a evitar calculadas (Berklee): una nota de la escala que no es del acorde es tensión,
// salvo que quede medio tono arriba de una nota del acorde (en dominantes, la b9 sobre la fundamental sí es tensión).
export function tensionsOf(chord, scale) {
  const tones = chord.intervals.map(ivSemis);
  const dom = chord.intervals.includes('3') && chord.intervals.includes('b7');
  const t = [];
  const a = [];
  scale.intervals.forEach((iv) => {
    const s = ivSemis(iv);
    if (tones.includes(s)) return;
    const ext = toExt(iv);
    const clash = tones.some((x) => (s - x + 12) % 12 === 1 && !(dom && x === 0));
    (clash ? a : t).push(ext);
  });
  return { tensions: t, avoid: a };
}

export const impro = {
  title: 'Improvisación', group: 'Improvisación',
  desc: 'Qué escalas, pentatónicas y arpegios sirven sobre cada acorde.',
  settings: [
    { key: 'grupos', label: 'Contextos', multi: true, options: [['Diatónicos', 'Diatónicos'], ['Dominantes secundarios', 'Secundarios'], ['Sustitutos tritonales', 'SubV7'], ['Intercambio modal', 'Prestados']] },
    { key: 'raices', label: 'Tonalidades', options: [['nat', 'Naturales'], ['comunes', 'Hasta 5 alteraciones']] },
  ],
  defaults: { grupos: ['Diatónicos', 'Dominantes secundarios', 'Sustitutos tritonales', 'Intercambio modal'], raices: 'nat' },
  make(cfg) {
    return () => {
      const k = pick(keys(cfg.raices));
      const ctxs = contexts(k).filter((c) => cfg.grupos.includes(c.group));
      const c = pick(ctxs);
      if (!okSpell([c.root, ...spellAll(c.root, c.chord.intervals)])) return null;
      const main = scaleById(c.scale);
      const excl = new Set([c.scale, ...c.alt]);
      const pool = ['jonico', 'dorico', 'frigio', 'lidio', 'mixolidio', 'eolico', 'locrio', 'lidio-dom', 'mixolidio-b6', 'frigio-dom', 'alterada', 'locrio-n2', 'menor-melodica'].filter((x) => !excl.has(x));
      const opts = shuffle([c.scale, ...shuffle(pool).slice(0, 4)]).map((id) => ({ id, label: scaleById(id).name }));
      const { tensions, avoid } = c.tensions ? c : tensionsOf(c.chord, main);
      return {
        kicker: c.group, prompt: () => `En <b>${keyName(k)}</b>, sobre <b>${CH(c.root, c.chord)}</b> (${c.label}), ¿qué escala corresponde?`,
        ...choice(opts, c.scale), answerText: () => `${N(c.root)} ${lc(main.name)}`,
        explain: () => `${c.fn}. ${N(c.root)} ${main.name}: ${NL(spellAll(c.root, main.intervals))}. Tensiones: ${tensions.join(', ') || '—'}${avoid.length ? `; a evitar: ${avoid.join(', ')}` : ''}.${c.alt.length ? ` También: ${c.alt.map((x) => scaleById(x).name).join(', ')}.` : ''}`,
        sound: () => audio.playSeq(midisOf(c.root, [...main.intervals, '8'], 55), { step: 0.25 }),
        neck: () => Gt.scaleOnChord(c.root, main, c.chord, avoid.map((x) => x.replace(/^(b|#)?(9)$/, '$12').replace(/^(b|#)?(11)$/, '$14').replace(/^(b|#)?(13)$/, '$16'))), neckCap: () => `${N(c.root)} ${lc(main.name)} sobre ${CH(c.root, c.chord)}: notas del acorde por color, tensiones en violeta`,
      };
    };
  },
};

export const EXERCISES = { intervalos, escalas, acordes, grados, 'oido-funcional': oido, funciones, extensiones, secundarios, tritono, intercambio, impro };
export const GROUPS = ['Construcción', 'Análisis', 'Armonía', 'Improvisación'];
