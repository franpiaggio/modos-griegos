// Capítulos y logros de la v6: el curso VISUALIZAR (guitarra orientada a la visualización del diapasón).
// Seis capítulos y un trabajo final. Cada capítulo lista sus temas en orden; cada tema enlaza la teoría,
// las escalas y arpegios de Información y las herramientas de Técnica que lo trabajan.
// Se completa con un desafío (80 % o más) o, en Técnica y en el trabajo final, marcando cada tema como hecho.
import { store, prefs } from './ui.js';
import { SCALES, CHORDS } from './theory.js';

export const PASS = 80;

// Enlaces de cada tema: T = Teoría, E = escala en Información, A = arpegio en Información, K = Técnica, M = mástil completo.
const T = (id) => ['teoria', id];
const E = (id) => ['escala', id];
const A = (id) => ['arpegio', id];
const K = (path, label) => ['tecnica', path, label];
const M = (scale, label) => ['mastil', scale, label];
const X = (id, label) => K(`ejercicios/${id}`, label);

// temas: [{ t: título, d: detalle, links }]. info: qué escalas y arpegios presenta en Información.
// challenge: mezcla de generadores de teoria-gen.js. check: en lugar del desafío, se marca cada tema como hecho.
// lessons se arma con los temas de Teoría que aparecen en el capítulo.
const LIST = [
  {
    id: 'pentatonica', title: 'El diapasón y la escala pentatónica',
    desc: 'Mapa del diapasón, intervalos, pentatónica mayor y relativa menor, escala de blues y fraseo.',
    temas: [
      { t: 'Características del instrumento', d: 'Afinación por cuartas y la excepción de la tercera mayor entre la 3ra y la 2da cuerda.', links: [T('intervalos')] },
      { t: 'Mapa del diapasón', d: 'Notas naturales, octavas y unísonos en todo el mástil.', links: [M('jonico', 'Mástil completo')] },
      { t: 'Intervalos en el diapasón', d: 'La figura de cada intervalo entre cuerdas vecinas.', links: [T('intervalos')] },
      { t: 'Características de la escala pentatónica', d: 'Cinco notas sin semitonos. Mayor: 1 2 3 5 6. Menor: 1 b3 4 5 b7.', links: [T('escalas'), E('penta-mayor'), E('penta-menor')] },
      { t: 'Las cinco posiciones y su conexión', d: 'Cómo se encadenan las figuras a lo largo del mástil (sistema CAGED).', links: [E('penta-menor'), K('acordes', 'Formación de acordes (CAGED)')] },
      { t: 'Pentatónica mayor y relativa menor', d: 'Misma figura, distinto centro tonal: Do mayor y La menor comparten notas.', links: [E('penta-mayor'), E('penta-menor')] },
      { t: 'Escala de blues', d: 'La blue note (b5) en la pentatónica menor y la b3 en la pentatónica mayor.', links: [E('blues'), E('blues-mayor')] },
      { t: 'Recursos de fraseo', d: 'Bends, vibrato, slides, hammer-on y pull-off.', links: [X('bends', 'Bends'), X('vibrato', 'Vibrato'), X('slides', 'Slides'), X('ligado-asc', 'Hammer-on'), X('ligado-desc', 'Pull-off')] },
      { t: 'Ejercicios de visualización y fluidez', d: 'Secuencias de 3 y 4 notas, recorridos horizontales, una sola cuerda, pares de cuerdas, pregunta y respuesta.', links: [K('acorde-escalas', 'Escalas sobre un acorde fijo')] },
    ],
    info: { fams: ['penta'] },
    challenge: [
      ['intervalos', { tipo: ['construir', 'identificar'], dir: 'asc', nivel: 'basicos', raices: 'nat' }],
      ['escalas', { tipos: ['penta-mayor', 'penta-menor', 'blues'], raices: 'nat' }],
      ['grados', { tipo: ['detectar'], escalas: 'basico', orden: 'ordenada', raices: 'nat' }],
    ],
  },
  {
    id: 'acordes', title: 'Acordes, arpegios y escala',
    desc: 'Tríadas y tétradas, sus figuras en el mástil y la relación acorde, arpegio y pentatónica.',
    temas: [
      { t: 'Construcción de acordes', d: 'Tríadas mayor, menor, disminuida y aumentada. Tétradas maj7, m7, 7, m7(b5) y °7.', links: [T('acordes')] },
      { t: 'Figuras con raíz en 6ta, 5ta y 4ta cuerda', d: 'Las formas básicas de cada tipo de acorde.', links: [K('acordes', 'Formación de acordes')] },
      { t: 'Tríadas por grupos de cuerdas e inversiones', d: 'La misma tríada en cuatro grupos de tres cuerdas.', links: [K('acordes', 'Formación de acordes (tríadas por cuerdas)')] },
      { t: 'Arpegios de tríadas y tétradas', d: 'Con raíz en 6ta y 5ta cuerda, en todas las tonalidades (partiendo de Do).', links: [A('mayor'), A('menor'), A('maj7'), A('m7'), A('7'), A('m7b5'), A('dim7')] },
      { t: 'Relación entre la figura del acorde y su arpegio', d: 'La figura del acorde contiene el arpegio: se toca nota por nota.', links: [K('acorde-arpegios', 'Arpegios sobre un acorde fijo')] },
      { t: 'Acorde, arpegio y pentatónica', d: 'Ubicar las notas del acorde dentro de la pentatónica: notas objetivo.', links: [K('acorde-escalas', 'Escalas sobre un acorde fijo'), T('impro')] },
      { t: 'Ejercicios', d: 'Seguir los cambios de acorde con arpegios, notas guía (3ra y 7ma), progresión I-IV-V marcando las notas objetivo.', links: [K('v-i', 'Relaciones V – I')] },
    ],
    info: { chords: ['Tríadas', 'Con 7ma'] },
    challenge: [['acordes', { modo: ['armar', 'identificar'], niveles: ['triadas', 'septimas'], raices: 'nat' }]],
  },
  {
    id: 'tonal', title: 'Sistema tonal: escala mayor, menor y círculo de quintas',
    desc: 'Escala mayor y su armonización, funciones, tensiones, menor armónica y dominantes secundarios.',
    temas: [
      { t: 'De la pentatónica a la escala mayor', d: 'Las dos notas que se suman (4 y 7) y los semitonos.', links: [T('escalas'), E('jonico')] },
      { t: 'Posiciones de la escala mayor', d: 'Figuras CAGED y tres notas por cuerda.', links: [E('jonico'), X('economy', 'Economy picking (3 notas por cuerda)')] },
      { t: 'Armonización de la escala mayor', d: 'Acordes diatónicos en tríadas y tétradas, y sus grados.', links: [T('grados'), T('funciones')] },
      { t: 'Armonía funcional', d: 'Tónica, subdominante y dominante. Tensión y reposo; el tritono.', links: [T('funciones'), T('oido-funcional')] },
      { t: 'Notas de tensión y notas a evitar', d: '9, 11 y 13 sobre cada grado.', links: [T('funciones')] },
      { t: 'Círculo de quintas', d: 'Armaduras, tonalidades vecinas y el movimiento por quintas (ii-V-I).', links: [T('secundarios')] },
      { t: 'Escala menor natural y menor armónica', d: 'La sensible y el V7 en tonalidad menor.', links: [E('eolico'), E('menor-armonica')] },
      { t: 'Dominantes secundarios', d: 'El V7 de cada grado y su resolución.', links: [T('secundarios'), K('v-i', 'Relaciones V – I')] },
      { t: 'Cadencias y progresiones comunes', d: 'I-vi-IV-V, ii-V-I, i-iv-V.', links: [K('v-i', 'Relaciones V – I')] },
      { t: 'Ejercitación armónica y melódica', d: 'Analizar canciones, crear progresiones e improvisar remarcando la resolución.', links: [T('oido-funcional')] },
    ],
    info: { scales: ['jonico', 'eolico', 'menor-armonica'] },
    challenge: [
      ['escalas', { tipos: ['jonico', 'eolico', 'menor-armonica'], raices: 'nat' }],
      ['funciones', { tipo: ['cifrar', 'grado', 'tensiones', 'evitar'], tonos: ['mayor'], raices: 'nat' }],
      ['secundarios', { tipo: ['cifrar', 'resuelve'], raices: 'nat' }],
    ],
  },
  {
    id: 'modos', title: 'Modos griegos',
    desc: 'Los siete modos de la escala mayor: color, posiciones, arpegios y uso modal.',
    temas: [
      { t: 'Los modos como rotaciones de la escala mayor', d: 'Enfoque relativo (mismas notas) y paralelo (misma tónica).', links: [T('grados')] },
      { t: 'Características de cada modo', d: 'Fórmula, nota característica y color, del más brillante (lidio) al más oscuro (locrio).', links: [T('escalas'), E('dorico'), E('lidio'), E('mixolidio')] },
      { t: 'Posiciones en el diapasón', d: 'Las mismas figuras de la escala mayor con otra tónica.', links: [E('jonico'), E('frigio'), E('eolico'), E('locrio')] },
      { t: 'Arpegios con séptima', d: 'El arpegio de cada grado: maj7, m7, 7 y m7(b5).', links: [A('maj7'), A('m7'), A('7'), A('m7b5')] },
      { t: 'Relación acorde, arpegio y modo', d: 'Cada acorde diatónico con su modo.', links: [K('acorde-escalas', 'Escalas sobre un acorde fijo'), T('impro')] },
      { t: 'Armonía modal', d: 'Vamps, acordes característicos y cómo evitar que el oído vuelva a la tonalidad mayor. Relación con el intercambio modal (acordes prestados de los modos paralelos).', links: [K('acorde-escalas', 'Escalas sobre un acorde fijo'), T('intercambio')] },
      { t: 'Melodía modal', d: 'Destacar la nota característica de cada modo.', links: [K('acorde-escalas', 'Escalas sobre un acorde fijo')] },
      { t: 'Ejercitación', d: 'Improvisar sobre un vamp de cada modo y analizar canciones de referencia.', links: [T('grados')] },
    ],
    info: { fams: ['mayor'] },
    challenge: [
      ['escalas', { tipos: ['modos'], raices: 'nat' }],
      ['grados', { tipo: ['grado', 'detectar'], escalas: 'modos', orden: 'ordenada', raices: 'nat' }],
    ],
  },
  {
    id: 'tecnica', title: 'Técnica', check: true, parallel: true,
    desc: 'Se practica en paralelo desde el capítulo 1. Marcá cada tema cuando lo tengas incorporado a tu rutina.',
    temas: [
      { t: 'Postura, relajación y apagado de cuerdas', d: 'Con las dos manos.', links: [X('apagado', 'Apagado'), X('palm', 'Palm muting')] },
      { t: 'Mano derecha y ejercicios de púa', d: 'Púa alternada, economy picking y cambio de cuerda (inside y outside).', links: [X('alternada', 'Púa alternada'), X('cruce', 'Cruce de cuerdas'), X('economy', 'Economy picking')] },
      { t: 'Mano izquierda y púa alternada con metrónomo', d: 'Subdivisiones (corcheas, tresillos, semicorcheas) y aumento progresivo del tempo.', links: [K('metronomo', 'Metrónomo'), X('subdivisiones', 'Subdivisiones'), X('independencia', 'Independencia')] },
      { t: 'Velocidad por cuerdas', d: 'Una cuerda, cambios de cuerda y cromáticos 1-2-3-4.', links: [X('arana', 'Cromático 1-2-3-4'), X('tremolo', 'Trémolo'), X('saltos', 'Saltos de cuerda')] },
      { t: 'Ligados', d: 'Hammer-on, pull-off, trinos y ligados de tres notas por cuerda.', links: [X('ligado-asc', 'Hammer-on'), X('ligado-desc', 'Pull-off'), X('trinos', 'Trinos')] },
      { t: 'Ligado 3-13', d: 'Ligados de gran extensión en la misma cuerda (del traste 3 al 13): apertura de mano y fuerza de los dedos. Por ahora se trabaja con estiramientos y hammer-on.', links: [X('estiramiento', 'Estiramientos'), X('ligado-asc', 'Hammer-on')] },
      { t: 'Barridos (sweep picking)', d: 'Arpegios en 3 cuerdas; cuando salga limpio, extender la misma figura a 5 cuerdas.', links: [X('sweep', 'Sweep en 3 cuerdas')] },
      { t: 'Bends y vibrato afinados', d: 'Medio tono, un tono y bend al unísono.', links: [X('bends', 'Bends'), X('vibrato', 'Vibrato')] },
      { t: 'Rutina de estudio', d: 'Armá tu rutina con los ejercicios por objetivo y registrá los tempos.', links: [K('ejercicios', 'Ejercicios por objetivo')] },
    ],
    info: {},
  },
  {
    id: 'extensiones', title: 'Extensiones de arpegios y escalas',
    desc: 'Superposición: arpegios y pentatónicas desde otros grados del acorde para sumar tensiones.',
    temas: [
      { t: 'Concepto de superposición', d: 'El arpegio tocado desde la 3ra suma la 9; desde la 5ta, la 9 y la 11; desde la 7ma, la 13.', links: [T('extensiones')] },
      { t: 'Blues menor', d: 'Sobre Am7: Em pentatónica (suma la 9), arpegio de Cmaj7 (Am9) y Bm pentatónica (color dórico: usarla sobre el i; en el iv volver a Am).', links: [E('penta-menor'), E('dorico'), A('m9')] },
      { t: 'Blues mayor', d: 'Mezcla de pentatónica mayor y menor, mixolidio y otras pentatónicas sobre el dominante.', links: [E('blues-mayor'), E('mixolidio'), A('9')] },
      { t: 'Acorde mayor 7: problema y solución', d: 'Desde la 3ra: iiim7 (Em7 sobre Cmaj7, suena Cmaj9). Desde la 5ta, el V7 (G7) trae la 4ta (Fa), nota a evitar. Solución: Vmaj7 (Gmaj7, color lidio #11) o la tríada del V.', links: [A('maj9'), A('maj7s11'), E('lidio')] },
      { t: 'Acorde menor 7', d: 'Desde la b3: bIIImaj7 (Cmaj7 sobre Am7, suena Am9). Desde la 5ta: vm7 (Em7 sobre Am7, suena Am11).', links: [A('m9'), A('m11')] },
      { t: 'Acorde dominante', d: 'Desde la 3ra: m7(b5) (Bm7(b5) sobre G7, suena G9). Desde la 5ta: m7 (Dm7 sobre G7) suma 9 y 11, pero la 11 choca con la 3ra: usarlo sobre 7sus4. Para la #11, lidio dominante. Dominante alterado (7mo modo de la menor melódica) y sustitución tritonal.', links: [A('9'), A('9sus4'), E('lidio-dom'), E('alterada'), T('tritono')] },
      { t: 'Acorde semidisminuido', d: 'Desde la b3: m6 (Cm6 sobre Am7(b5)), suma la 9 y la 11.', links: [A('m7b5'), A('m6')] },
      { t: 'Pentatónicas superpuestas por tipo de acorde', d: 'Sobre maj7: pentatónica menor desde la 3ra o la 7ma (Em o Bm sobre Cmaj7). Sobre m7: pentatónica menor desde la 5ta y la 2da. Sobre 7: pentatónica mayor de la tónica (G sobre G7); menor desde la 5ta (Dm) solo sobre 7sus4; para el dominante alterado, menor desde la b6 (Ebm sobre G7: b9, #9, b13).', links: [E('penta-menor'), E('penta-mayor'), T('impro')] },
      { t: 'Ejercitación', d: 'Aplicar las superposiciones sobre un blues y sobre ii-V-I.', links: [K('v-i', 'Relaciones V – I'), K('acorde-arpegios', 'Arpegios sobre un acorde fijo')] },
    ],
    info: { chords: ['Extensiones'], scales: ['alterada', 'lidio-dom', 'menor-melodica'] },
    challenge: [
      ['extensiones', { tipo: ['aporte', 'cual', 'armar'], raices: 'nat' }],
      ['impro', { grupos: ['Diatónicos', 'Dominantes secundarios'], raices: 'nat' }],
      ['tritono', { tipo: ['subv', 'tritono'], raices: 'nat' }],
    ],
  },
  {
    id: 'final', title: 'Trabajo final de improvisación', check: true,
    desc: 'Un solo en cada género. Se arma antes según los gustos musicales del alumno. Marcá cada solo cuando esté grabado.',
    temas: [
      { t: 'Solo sobre una base de blues', d: '12 compases, shuffle. Pentatónica menor y mayor, blue note, arpegios de cada dominante.', links: [E('blues'), E('blues-mayor'), A('7')] },
      { t: 'Solo sobre una base de rock', d: 'Pentatónica menor, eólico y dórico; bends y vibrato.', links: [E('penta-menor'), E('eolico'), E('dorico')] },
      { t: 'Solo sobre una balada de rock, pop o country', d: 'Pentatónica mayor, jónico y notas objetivo en cada cambio.', links: [E('penta-mayor'), E('jonico'), K('v-i', 'Relaciones V – I')] },
      { t: 'Solo sobre una base de metal', d: 'Eólico, frigio y menor armónica; púa alternada, ligados y barridos.', links: [E('frigio'), E('menor-armonica'), X('sweep', 'Sweep')] },
      { t: 'Opcional: otro género', d: 'Funk, jazz u otro que elija el alumno.', links: [T('impro')] },
      { t: 'Armado del trabajo', d: 'Análisis de la base, elección de escalas y arpegios, solo con estructura (inicio, desarrollo y clímax), grabación y devolución.', links: [K('acorde-escalas', 'Sobre un acorde fijo'), T('impro')] },
    ],
    info: {},
  },
];

export const CHAPTERS = LIST.map((c, i) => ({
  ...c, n: i + 1,
  lessons: [...new Set(c.temas.flatMap((t) => t.links.filter((l) => l[0] === 'teoria').map((l) => l[1])))],
}));

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);

// ---------------------------------------------------------------- progreso
const done = () => store.get('cap.done', {});
export const isFree = () => prefs.libre === 'on';
export const isChapterDone = (id) => !!done()[id];
export const chapterResult = (id) => done()[id] || null;
// Técnica es paralela: está abierta desde el inicio y no frena a los demás capítulos.
// Cada capítulo se abre al completar el anterior que no sea paralelo.
export const prevGate = (c) => [...CHAPTERS].slice(0, c.n - 1).reverse().find((x) => !x.parallel) || null;
export const nextGate = (c) => (c.parallel ? null : CHAPTERS.slice(c.n).find((x) => !x.parallel) || null);
export function isUnlocked(id) {
  const c = chapterById(id);
  if (!c) return false;
  if (c.n === 1 || c.parallel || isFree()) return true;
  const p = prevGate(c);
  return !p || isChapterDone(p.id);
}
export const doneCount = () => CHAPTERS.filter((c) => isChapterDone(c.id)).length;
// Próximo capítulo a estudiar: el primero sin completar (Técnica, que es paralela, al final)
export const nextChapter = () => CHAPTERS.find((c) => !c.parallel && !isChapterDone(c.id)) || CHAPTERS.find((c) => !isChapterDone(c.id)) || null;

// Capítulo que desbloquea un ítem de Información (o null si no depende de ninguno)
export function chapterForInfo(kind, typeId) {
  if (kind === 'escala') {
    const s = SCALES.find((x) => x.id === typeId);
    if (!s) return null;
    return CHAPTERS.find((c) => c.info.scales?.includes(s.id)) || CHAPTERS.find((c) => c.info.fams?.includes(s.fam)) || null;
  }
  const ch = CHORDS.find((x) => x.id === typeId);
  if (!ch) return null;
  return CHAPTERS.find((c) => c.info.chords?.includes(ch.group)) || null;
}
export function unlockedInfo(kind, typeId) {
  const chapter = chapterForInfo(kind, typeId);
  // Información es libre: la progresión vive solo en Capítulos
  return { ok: true, chapter };
}
// Ítems de Información de un capítulo: [{ kind, id, name }]
export function infoItems(c) {
  const out = [];
  SCALES.forEach((s) => {
    if (c.info.scales?.includes(s.id) || (c.info.fams?.includes(s.fam) && !out.some((o) => o.id === s.id))) out.push({ kind: 'escala', id: s.id, name: s.name });
  });
  CHORDS.forEach((ch) => { if (c.info.chords?.includes(ch.group)) out.push({ kind: 'arpegio', id: ch.id, name: ch.name }); });
  return out;
}

// ---------------------------------------------------------------- logros
export const LOGROS = [
  { id: 'primer-desafio', title: 'Primer desafío', desc: 'Terminaste tu primer desafío.' },
  { id: 'aprobado', title: 'Primer capítulo', desc: 'Completaste un capítulo.' },
  { id: 'racha-5', title: 'Racha de 5', desc: '5 respuestas bien seguidas en un desafío.' },
  { id: 'perfecto', title: 'Sesión perfecta', desc: '100 % en un desafío.' },
  { id: 'diapason', title: 'Diapasón a la vista', desc: 'Completaste pentatónica y acordes (capítulos 1 y 2).' },
  { id: 'escalas', title: 'Escalas a mano', desc: 'Completaste sistema tonal y modos (capítulos 3 y 4).' },
  { id: 'tecnica', title: 'Rutina técnica', desc: 'Marcaste todos los temas de Técnica.' },
  { id: 'extensiones', title: 'Superposición', desc: 'Completaste extensiones de arpegios y escalas.' },
  { id: 'mitad', title: 'Mitad del camino', desc: `Completaste ${Math.ceil(CHAPTERS.length / 2)} capítulos.` },
  { id: 'todos', title: 'Curso completo', desc: 'Completaste los seis capítulos y el trabajo final.' },
];
export const earned = () => store.get('cap.logros', {});
export function award(id) {
  const all = earned();
  if (all[id]) return false;
  all[id] = Date.now();
  store.set('cap.logros', all);
  return true;
}

// Registra el resultado de un desafío. Devuelve { passed, firstPass, newLogros: [logro], unlocked: capítulo | null }
export function recordChallenge(id, pct, bestStreak) {
  const c = chapterById(id);
  const all = done();
  const prev = all[id];
  const passed = pct >= PASS;
  const tries = store.get('cap.tries', {});
  tries[id] = { best: Math.max(tries[id]?.best || 0, pct), last: pct, n: (tries[id]?.n || 0) + 1 };
  store.set('cap.tries', tries);
  const ng = nextGate(c);
  const wasNextLocked = !!ng && !isUnlocked(ng.id);
  if (passed) {
    all[id] = { best: Math.max(prev?.best || 0, pct), t: prev?.t || Date.now() };
    store.set('cap.done', all);
  }
  const fresh = [];
  const give = (lid, cond) => { if (cond && award(lid)) fresh.push(LOGROS.find((l) => l.id === lid)); };
  give('primer-desafio', true);
  chapterLogros(give);
  give('racha-5', bestStreak >= 5);
  give('perfecto', pct === 100);
  const unlocked = passed && wasNextLocked && isUnlocked(ng.id) ? ng : null;
  return { passed, firstPass: passed && !prev, newLogros: fresh, unlocked };
}
// Logros que dependen de los capítulos completados (desafío o lista de temas)
function chapterLogros(give) {
  const has = (...ids) => ids.every(isChapterDone);
  give('aprobado', doneCount() > 0);
  give('diapason', has('pentatonica', 'acordes'));
  give('escalas', has('tonal', 'modos'));
  give('tecnica', has('tecnica'));
  give('extensiones', has('extensiones'));
  give('mitad', doneCount() >= Math.ceil(CHAPTERS.length / 2));
  give('todos', doneCount() === CHAPTERS.length);
}

// ---------------------------------------------------------------- capítulos por lista de temas
// checks: { [capítulo]: [índices de temas hechos] }. Con todos marcados el capítulo queda completo.
export const checked = (id) => new Set(store.get('cap.checks', {})[id] || []);
export function toggleTema(id, i, on) {
  const c = chapterById(id);
  const all = store.get('cap.checks', {});
  const set = new Set(all[id] || []);
  if (on) set.add(i); else set.delete(i);
  all[id] = [...set].sort((a, b) => a - b);
  store.set('cap.checks', all);
  const ng = nextGate(c);
  const wasNextLocked = !!ng && !isUnlocked(ng.id);
  const doneMap = done();
  const complete = set.size === c.temas.length;
  const firsts = store.get('cap.first', {});
  const firstPass = complete && !firsts[id];
  if (firstPass) { firsts[id] = Date.now(); store.set('cap.first', firsts); }
  if (complete && !doneMap[id]) doneMap[id] = { best: 100, t: Date.now() };
  if (!complete && doneMap[id]) delete doneMap[id];
  store.set('cap.done', doneMap);
  const fresh = [];
  if (complete) chapterLogros((lid, cond) => { if (cond && award(lid)) fresh.push(LOGROS.find((l) => l.id === lid)); });
  const unlocked = complete && wasNextLocked && isUnlocked(ng.id) ? ng : null;
  return { complete, firstPass, newLogros: fresh, unlocked, count: set.size };
}
export const tries = (id) => store.get('cap.tries', {})[id] || null;
