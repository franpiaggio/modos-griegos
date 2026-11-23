// Capítulos y logros de la v5: el material de estudio se ordena en capítulos. Cada capítulo tiene teoría,
// información para el mástil y un desafío. Superar el desafío (80 % o más) completa el capítulo,
// desbloquea el siguiente y la información de Información que le corresponde.
// La teoría y la práctica de Teoría/Técnica quedan siempre libres; solo se bloquea la Información.
import { store, prefs } from './ui.js';
import { SCALES, CHORDS } from './theory.js';

export const PASS = 80;

// info: qué desbloquea en Información. scales: ids de escala; fams: familias completas; chords: grupos de arpegios.
// challenge: mezcla de generadores de teoria-gen.js con su configuración fija.
export const CHAPTERS = [
  {
    id: 'intervalos', title: 'Intervalos', desc: 'Distancia entre dos notas: número y tipo de intervalo.',
    lessons: ['intervalos'], info: {},
    challenge: [['intervalos', { tipo: ['construir', 'identificar'], dir: 'asc', nivel: 'basicos', raices: 'nat' }]],
  },
  {
    id: 'escalas', title: 'Escala mayor y menor', desc: 'Qué es una escala, tonalidad y cómo armarla nota por nota.',
    lessons: ['escalas'], info: { scales: ['jonico', 'eolico'] },
    challenge: [['escalas', { tipos: ['jonico', 'eolico'], raices: 'nat' }]],
  },
  {
    id: 'modos', title: 'Modos griegos', desc: 'Los 7 modos de la escala mayor y sus grados.',
    lessons: ['grados', 'escalas'], info: { fams: ['mayor'] },
    tecnica: ['acorde-escalas', 'Escalas sobre un acorde fijo'],
    challenge: [
      ['escalas', { tipos: ['modos'], raices: 'nat' }],
      ['grados', { tipo: ['grado', 'detectar'], escalas: 'modos', orden: 'ordenada', raices: 'nat' }],
    ],
  },
  {
    id: 'pentatonicas', title: 'Pentatónicas y blues', desc: 'Pentatónica mayor y menor, escala de blues y pentatónica mixolidia.',
    lessons: ['escalas'], info: { fams: ['penta'] },
    tecnica: ['acorde-escalas', 'Escalas sobre un acorde fijo'],
    challenge: [
      ['escalas', { tipos: ['penta-mayor', 'penta-menor', 'blues'], raices: 'nat' }],
      ['grados', { tipo: ['detectar'], escalas: 'basico', orden: 'ordenada', raices: 'nat' }],
    ],
  },
  {
    id: 'triadas', title: 'Acordes: tríadas', desc: 'Mayor, menor, disminuido y aumentado: superposición de terceras.',
    lessons: ['acordes'], info: { chords: ['Tríadas'] },
    tecnica: ['acordes', 'Formación de acordes'],
    challenge: [['acordes', { modo: ['armar', 'identificar'], niveles: ['triadas'], raices: 'nat' }]],
  },
  {
    id: 'septimas', title: 'Tétradas y arpegios con 7ma', desc: 'Maj7, 7, m7, m7(b5), °7 y m(maj7).',
    lessons: ['acordes'], info: { chords: ['Con 7ma'] },
    tecnica: ['acorde-arpegios', 'Arpegios sobre un acorde fijo'],
    challenge: [['acordes', { modo: ['armar', 'identificar'], niveles: ['septimas'], raices: 'nat' }]],
  },
  {
    id: 'armonica', title: 'Menor armónica', desc: 'La menor con 7ma mayor (sensible) y sus acordes.',
    lessons: ['escalas', 'funciones'], info: { fams: ['armonica'] },
    challenge: [
      ['escalas', { tipos: ['menor-armonica'], raices: 'nat' }],
      ['funciones', { tipo: ['cifrar', 'grado'], tonos: ['armonica'], raices: 'nat' }],
    ],
  },
  {
    id: 'melodica', title: 'Menor melódica', desc: 'La menor con 6ta y 7ma mayores y sus modos.',
    lessons: ['escalas', 'funciones'], info: { fams: ['melodica'] },
    challenge: [
      ['escalas', { tipos: ['menor-melodica'], raices: 'nat' }],
      ['funciones', { tipo: ['cifrar', 'grado'], tonos: ['melodica'], raices: 'nat' }],
    ],
  },
  {
    id: 'funciones', title: 'Funciones y acordes extendidos', desc: 'Tónica, subdominante y dominante; tensiones de cada grado.',
    lessons: ['funciones', 'extensiones', 'oido-funcional'], info: {},
    challenge: [
      ['funciones', { tipo: ['cifrar', 'grado', 'tensiones', 'evitar', 'extendido'], tonos: ['mayor'], raices: 'nat' }],
      ['extensiones', { tipo: ['aporte', 'cual', 'armar'], raices: 'nat' }],
    ],
  },
  {
    id: 'secundarios', title: 'Dominantes secundarios y V–I', desc: 'El V7 de cada grado y su resolución.',
    lessons: ['secundarios'], info: {},
    tecnica: ['v-i', 'Relaciones V – I'],
    challenge: [['secundarios', { tipo: ['cifrar', 'armar', 'identificar', 'resuelve', 'tensiones', 'escala'], raices: 'nat' }]],
  },
  {
    id: 'intercambio', title: 'Intercambio modal', desc: 'Acordes prestados de los modos paralelos.',
    lessons: ['intercambio'], info: {},
    challenge: [['intercambio', { tipo: ['armar', 'origen', 'cual', 'escala'], raices: 'nat' }]],
  },
  {
    id: 'tritono', title: 'Sustitución tritonal', desc: 'El subV7: dominantes que comparten el tritono.',
    lessons: ['tritono'], info: {},
    challenge: [['tritono', { tipo: ['subv', 'tritono', 'tonalidad', 'escala'], raices: 'nat' }]],
  },
  {
    id: 'impro', title: 'Improvisación', desc: 'Qué escala, pentatónica o arpegio tocar sobre cada acorde.',
    lessons: ['impro'], info: {},
    tecnica: ['acorde-escalas', 'Escalas sobre un acorde fijo'],
    challenge: [['impro', { grupos: ['Diatónicos', 'Dominantes secundarios', 'Sustitutos tritonales', 'Intercambio modal'], raices: 'nat' }]],
  },
].map((c, i) => ({ ...c, n: i + 1 }));

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);

// ---------------------------------------------------------------- progreso
const done = () => store.get('cap.done', {});
export const isFree = () => prefs.libre === 'on';
export const isChapterDone = (id) => !!done()[id];
export const chapterResult = (id) => done()[id] || null;
export function isUnlocked(id) {
  const c = chapterById(id);
  if (!c) return false;
  if (c.n === 1 || isFree()) return true;
  return isChapterDone(CHAPTERS[c.n - 2].id);
}
export const doneCount = () => CHAPTERS.filter((c) => isChapterDone(c.id)).length;
// Próximo capítulo a estudiar (el primero sin completar)
export const nextChapter = () => CHAPTERS.find((c) => !isChapterDone(c.id)) || null;

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
  return { ok: !chapter || isFree() || isChapterDone(chapter.id), chapter };
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
  { id: 'escalas', title: 'Escalas a mano', desc: 'Completaste los capítulos de escalas (2 a 4).' },
  { id: 'acordes', title: 'Arpegios a mano', desc: 'Completaste tríadas y tétradas.' },
  { id: 'menores', title: 'Las tres menores', desc: 'Completaste menor armónica y melódica.' },
  { id: 'mitad', title: 'Mitad del camino', desc: `Completaste ${Math.ceil(CHAPTERS.length / 2)} capítulos.` },
  { id: 'todos', title: 'Libro completo', desc: 'Completaste todos los capítulos.' },
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
  const wasNextLocked = c.n < CHAPTERS.length && !isUnlocked(CHAPTERS[c.n].id);
  if (passed) {
    all[id] = { best: Math.max(prev?.best || 0, pct), t: prev?.t || Date.now() };
    store.set('cap.done', all);
  }
  const fresh = [];
  const give = (lid, cond) => { if (cond && award(lid)) fresh.push(LOGROS.find((l) => l.id === lid)); };
  const has = (...ids) => ids.every(isChapterDone);
  give('primer-desafio', true);
  give('aprobado', passed);
  give('racha-5', bestStreak >= 5);
  give('perfecto', pct === 100);
  give('escalas', has('escalas', 'modos', 'pentatonicas'));
  give('acordes', has('triadas', 'septimas'));
  give('menores', has('escalas', 'armonica', 'melodica'));
  give('mitad', doneCount() >= Math.ceil(CHAPTERS.length / 2));
  give('todos', doneCount() === CHAPTERS.length);
  const unlocked = passed && wasNextLocked && c.n < CHAPTERS.length ? CHAPTERS[c.n] : null;
  return { passed, firstPass: passed && !prev, newLogros: fresh, unlocked };
}
export const tries = (id) => store.get('cap.tries', {})[id] || null;
