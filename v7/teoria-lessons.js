// Explicaciones ("Teoría") de cada ejercicio. Las tablas se generan con theory.js, así coinciden con lo que se practica.
import {
  note, noteName, notePc, transpose, chordById, scaleById, SCALES, diatonic, MAJOR_FUNCTIONS, SECONDARY, BORROWED,
  fromTonic, tritoneSub, superimpositions, IMPRO, INTERVALS, intervalLong, idToFormula, spellAll, MODE_NAMES_FROM, ivSemis, spellingsOf, intervalBetween,
} from './theory.js';
import { prefs, esc } from './ui.js';
import * as V from './viz.js';

const C = note(0);
const nn = (n) => noteName(n, prefs.notation);
const sym = (root, id) => nn(root) + chordById(id).sym;
// alturas ascendentes (MIDI) de una lista de notas escritas, desde la octava de base
function asc(notes, base = 48) {
  let prev = -1;
  return notes.map((n) => {
    let m = base + notePc(n);
    while (m <= prev) m += 12;
    prev = m;
    return m;
  });
}
// botón para escuchar: modo 'seq' (melódico) o 'chord' (armónico)
const play = (midis, mode = 'seq', label = '') => `<button class="lplay" data-play="${midis.join(',')}" data-mode="${mode}" aria-label="Escuchar ${esc(label)}" title="Escuchar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg></button>`;
const chordPlay = (root, id) => play(asc(spellAll(root, chordById(id).intervals)), 'chord', sym(root, id));
const table = (head, rows) => `<div class="ltable" tabindex="0"><table><thead><tr>${head.map((h) => `<th>${h || '<span class="sr">Escuchar</span>'}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const box = (title, body, cls = '') => `<section class="lbox ${cls}"><h2>${title}</h2>${body}</section>`;
const tip = (t) => `<p class="ltip"><b>En la guitarra:</b> ${t}</p>`;
const key = (t) => `<p class="lkey">${t}</p>`;

const tones = (semis) => (semis % 2 ? `${(semis - 1) / 2 ? (semis - 1) / 2 + ' y medio' : 'medio'}` : String(semis / 2)).replace(/^1 y medio$/, '1 y medio');
// esquema de tonos y semitonos de una escala de 7 notas: T, st, T+st
function scheme(intervals) {
  const st = [...intervals.map(ivSemis), 12];
  return st.slice(1).map((x, i) => ({ 1: 'st', 2: 'T', 3: 'T+st' }[x - st[i]]));
}
// Ejemplo de armado: letras naturales, distancias naturales, esquema buscado y ajuste
function buildExample(root, id, title) {
  const s = scaleById(id);
  const target = scheme(s.intervals);
  const naturals = Array.from({ length: 8 }, (_, i) => note(root.l + i, i === 0 || i === 7 ? root.a : 0));
  const natSch = naturals.slice(1).map((n, i) => ({ 1: 'st', 2: 'T', 3: 'T+st' }[((notePc(n) - notePc(naturals[i])) + 12) % 12] || '?'));
  const result = [...spellAll(root, s.intervals), root];
  const changed = result.map((n, i) => n.a !== naturals[i].a);
  // cada nota ocupa 2 columnas; las distancias quedan corridas media nota, entre las dos notas que miden
  const cell = (n, i) => `<td colspan="2" class="${changed[i] ? 'chg' : ''}">${nn(n)}</td>`;
  const gaps = (list, cls = () => '') => `<td class="pad"></td>${list.map((t, i) => `<td colspan="2" class="gap ${cls(t, i)}">${t}</td>`).join('')}<td class="pad"></td>`;
  return `<div class="ltable build-ex" tabindex="0" role="region" aria-label="${title}"><table><caption>${title}</caption><tbody>
    <tr><th scope="row">1 · Notas naturales</th>${naturals.map((n) => `<td colspan="2">${nn(n)}</td>`).join('')}</tr>
    <tr><th scope="row">Distancias</th>${gaps(natSch, (t, i) => (t !== target[i] ? 'off' : ''))}</tr>
    <tr><th scope="row">2 · Esquema</th>${gaps(target)}</tr>
    <tr><th scope="row">3 · Resultado</th>${result.map(cell).join('')}</tr>
  </tbody></table>${play(asc(result.slice(0, 7).concat(root)), 'seq', title)}${changed.some(Boolean) ? `<p class="lsmall">Se ajustó: ${result.filter((_, i) => changed[i] && i < 7).map(nn).join(', ')}.</p>` : '<p class="lsmall">Coincide con el esquema sin alteraciones.</p>'}</div>`;
}
// Escala cromática desde Do, con el intervalo de cada casilla y los arpegios principales marcados
function chromatic() {
  const IV = ['1', 'b2', '2', 'b3', '3', '4', '#4 / b5', '5', '#5 / b6', '6', 'bb7 / b7', '7'];
  const names = Array.from({ length: 12 }, (_, i) => PREF_NAMES(i));
  const ARPS = ['mayor', 'menor', 'dim', 'aum', 'maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'];
  const head = `<tr><th scope="col">Arpegio</th>${IV.map((iv, i) => `<th scope="col"><span class="cr-n">${names[i]}</span><span class="cr-i">${iv}</span><span class="cr-s">${i}</span></th>`).join('')}</tr>`;
  const rows = ARPS.map((id) => {
    const c = chordById(id);
    const set = new Map(c.intervals.map((iv) => [ivSemis(iv), iv]));
    return `<tr><th scope="row">${sym(C, id)}</th>${IV.map((_, i) => (set.has(i) ? `<td class="on"><span>${set.get(i)}</span></td>` : '<td><span class="sr">—</span></td>')).join('')}</tr>`;
  }).join('');
  return `<div class="ltable chroma" tabindex="0" role="region" aria-label="Escala cromática y arpegios"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div><p class="lsmall">Arriba: nota, intervalo y semitonos desde ${nn(C)}.</p>`;
}
const PREF_NAMES = (pc) => spellingsOf(pc).map(nn).join('/');

const DEG_NAMES = ['Tónica', 'Supertónica', 'Mediante', 'Subdominante', 'Dominante', 'Superdominante', 'Sensible'];
const ROMAN7 = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// ---------------------------------------------------------------- gráficos (viz.js) con nombres de la app
const fig = (svg, cap = '', cls = '') => `<figure class="${cls}">${svg}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const vrow = (...figs) => `<div class="viz-row">${figs.join('')}</div>`;
// teclado con las notas escritas (ascendentes desde la primera), coloreadas por rol si se pasan intervalos
function kbNotes(notes, { ivs = null, color = null, label = '' } = {}) {
  let m = asc(notes, 0);
  if (m[0] >= 12) m = m.map((x) => x - 12);
  const oct = Math.max(1, Math.ceil((m[m.length - 1] + 1) / 12));
  const marks = notes.map((n, i) => ({ i: m[i], label: nn(n), sub: ivs ? ivs[i] : '', color: color ? color(i) : ivs ? V.ROLE[V.roleOf(ivs[i])] : i === 0 ? V.ROLE[1] : '#5f5f69' }));
  return V.keyboard(marks, { octaves: oct, label: label || notes.map(nn).join(' ') });
}
// reloj cromático de un acorde o escala desde su tónica
function clockOf(root, intervals, { label = '', color = null, polygon = true, pairs = [] } = {}) {
  const items = intervals.map((iv) => ({ k: ivSemis(iv), name: nn(transpose(root, iv)), iv, color: color ? color(iv) : V.ROLE[V.roleOf(iv)] }));
  return V.clock(items, { label: label || `${nn(root)}: ${intervals.join(' ')}`, polygon, pairs });
}
// barra de tonos y semitonos de una escala; mark = intervalos a resaltar
function stepsOf(root, id, mark = []) {
  const s = scaleById(id);
  const notes = [...spellAll(root, s.intervals), root].map(nn);
  const mk = new Set(s.intervals.map((iv, i) => (mark.includes(iv) ? i : -1)).filter((i) => i >= 0));
  return V.steps(notes, s.intervals, { label: `${nn(root)} ${s.name}: ${scheme(s.intervals).join(' ')}`, mark: mk });
}
// acorde apilado por terceras (fundamental abajo)
function stackOf(root, intervals, label = '') {
  const notes = intervals.map((iv) => transpose(root, iv));
  const gaps = notes.slice(1).map((n, i) => intervalBetween(notes[i], n).id);
  return V.stack(notes.map((n, i) => ({ name: nn(n), iv: intervals[i] })), gaps, { label: label || notes.map(nn).join(' ') });
}
// círculo de quintas en Do: mayores por fuera, relativas menores por dentro
const FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'].map((s) => note('CDEFGAB'.indexOf(s[0]), s[1] === '#' ? 1 : s[1] === 'b' ? -1 : 0));
const posOf = (n) => (notePc(n) * 7) % 12;
const fifthsSvg = (opts) => V.fifths(FIFTHS.map(nn), FIFTHS.map((n) => nn(transpose(n, '6')) + 'm'), opts);
// tira de grados (I a VII) con color de función o de tendencia
const degStrip = (items) => `<ol class="deg-strip">${items.map((d) => `<li style="--c:${d.color || '#1E1E1E'}"><b>${d.top}</b><span>${d.mid}</span>${d.bot ? `<small>${d.bot}</small>` : ''}</li>`).join('')}</ol>`;

const L = {
  intervalos: () => {
    const rows = INTERVALS.filter((i) => !['2A', '3d', '6A', '4d', '7d', '5A'].includes(i.id)).map((i) => {
      const n = transpose(C, idToFormula(i.id));
      return [`<b>${i.id}</b>`, intervalLong(i.id), i.semis, tones(i.semis), `${nn(C)} – ${nn(n)}`, play([60, 60 + i.semis], 'seq', i.id)];
    });
    const D = note(1), F = note(3), B = note(6), E = note(2), Fs = note(3, 1), Eb = note(2, -1);
    return [
      key('El <b>intervalo</b> es la distancia entre dos sonidos o notas. Se mide por la <b>distancia</b> (cantidad de notas) y se clasifica por su <b>género</b> (cantidad de tonos y semitonos).'),
      box('1 · Distancia', `<p>Se cuentan las notas, incluidas las dos puntas. De ${nn(D)} a ${nn(F)} hay 3 notas: es una <b>tercera</b>.</p>
        ${vrow(fig(V.ruler([D, E, F].map(nn), 3, { label: `${nn(D)} a ${nn(F)}: 3 notas, tercera`, name: 'tercera' }), `${nn(D)} – ${nn(F)} ${play([62, 65], 'seq', `${nn(D)} ${nn(F)}`)}`, 'wide'))}
        <p>Las alteraciones <b>no cambian el nombre</b>: de ${nn(B)} a ${nn(Fs)} hay 5 notas, es una <b>quinta</b> (con o sin el #).</p>
        ${vrow(fig(V.ruler([B, C, D, E, Fs].map(nn), 7, { label: `${nn(B)} a ${nn(Fs)}: 5 notas, quinta`, name: 'quinta' }), `${nn(B)} – ${nn(Fs)} ${play([59, 66], 'seq', `${nn(B)} ${nn(Fs)}`)}`, 'wide'))}`),
      box('2 · Género del intervalo', `<p>Los tonos y semitonos dan el <b>color</b>. Misma tercera, distinto género:</p>
        ${vrow(fig(kbNotes([C, E], { ivs: ['1', '3'] }), `<b>${nn(C)} – ${nn(E)}</b>: 2 tonos = tercera mayor ${play([60, 64], 'seq', 'tercera mayor')}`),
          fig(kbNotes([C, Eb], { ivs: ['1', 'b3'] }), `<b>${nn(C)} – ${nn(Eb)}</b>: 1 tono y medio = tercera menor ${play([60, 63], 'seq', 'tercera menor')}`))}`),
      box('Tipos de intervalos', `<p><b>1, 4, 5, 8</b>: justos (J). <b>2, 3, 6, 7</b>: mayores (M) o menores (m). Un semitono más: aumentado (A); uno menos: disminuido (d).</p>
        ${table(['Intervalo', 'Nombre', 'Semitonos', 'Tonos', `Desde ${nn(C)}`, ''], rows)}`),
      box('Enarmonía', `<p>${nn(D)}–${nn(Fs)} (3M) y ${nn(D)}–${nn(note(4, -1))} (4d) <b>suenan igual</b> pero se escriben distinto: la <b>letra</b> define el intervalo.</p>`),
      box('Inversión', `<div class="inv"><span>2 ↔ 7</span><span>3 ↔ 6</span><span>4 ↔ 5</span><span>M ↔ m</span><span>A ↔ d</span><span>J = J</span></div><p class="lsmall">Suman 9. Ej.: ${nn(C)}–${nn(E)} es 3M; ${nn(E)}–${nn(C)} es 6m.</p>`),
      tip('en una cuerda, cada traste es un semitono (3M = 4 trastes, 5J = 7). Entre cuerdas vecinas hay una 4J, salvo Sol–Si (3M).'),
    ].join('');
  },

  escalas: () => {
    const A = note(5), G = note(4);
    const MAIN = [['jonico', 'Escala mayor', C, []], ['eolico', 'Escala menor', A, []], ['menor-armonica', 'Menor armónica', A, ['7']], ['menor-melodica', 'Menor melódica', A, ['6', '7']]];
    const others = ['penta-mayor', 'penta-menor', 'blues', 'blues-mayor'].map(scaleById).map((s) => {
      const root = s.offset === 9 ? A : C;
      const notes = spellAll(root, s.intervals);
      return [`<b>${s.name}</b>`, s.intervals.join(' '), notes.map(nn).join(' '), play(asc([...notes, root]), 'seq', s.name)];
    });
    const sPlay = (root, id) => play(asc([...spellAll(root, scaleById(id).intervals), root]), 'seq', scaleById(id).name);
    return [
      key('Una <b>escala</b> es un esquema de distancias entre sonidos, definido por los intervalos de cada nota con respecto a la <b>tónica</b>.'),
      box('Escala y tonalidad no son lo mismo', `<p>${nn(C)} mayor y ${nn(G)} mayor <b>no son escalas distintas</b>: son <b>tonalidades</b> de la misma escala mayor. Mismo esquema, otra tónica:</p>
        ${vrow(fig(stepsOf(C, 'jonico'), `${nn(C)} mayor ${sPlay(C, 'jonico')}`, 'wide'), fig(stepsOf(G, 'jonico', ['7']), `${nn(G)} mayor ${sPlay(G, 'jonico')}`, 'wide'))}`),
      box('Las 4 escalas principales', `<p><b>T</b> tono · <b>st</b> semitono · <b>T+st</b> tono y medio. En naranja, las notas que cambian respecto de la menor natural.</p>
        ${vrow(...MAIN.map(([id, name, root, mk]) => fig(stepsOf(root, id, mk), `<b>${name}</b> · ${scheme(scaleById(id).intervals).join(' ')} ${sPlay(root, id)}`, 'wide')))}`),
      box('Armado de una escala', `<ol><li>Escribí <b>7 notas consecutivas, sin alteraciones</b>, desde la tónica.</li><li>Medí cada distancia y comparala con el <b>esquema</b>.</li><li><b>Ajustá</b>: # sube medio tono, b baja medio tono.</li></ol>
        ${buildExample(C, 'jonico', `${nn(C)} mayor`)}
        ${buildExample(A, 'eolico', `${nn(A)} menor`)}
        ${buildExample(A, 'menor-armonica', `${nn(A)} menor armónica`)}
        ${buildExample(G, 'jonico', `${nn(G)} mayor`)}`),
      box('Otras escalas que se practican', table(['Escala', 'Fórmula', 'Ejemplo', ''], others)),
    ].join('');
  },

  acordes: () => {
    const tri = ['mayor', 'menor', 'dim', 'aum'];
    const sev = ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'];
    const more = ['sus2', 'sus4', 'maj7s5', '6', 'm6'];
    const row = (id) => { const c = chordById(id); return [`<b>${sym(C, id)}</b>`, c.name, c.intervals.join(' '), spellAll(C, c.intervals).map(nn).join(' '), chordPlay(C, id)]; };
    const st = (id) => fig(stackOf(C, chordById(id).intervals, `${sym(C, id)}: ${spellAll(C, chordById(id).intervals).map(nn).join(' ')}`), `<b>${sym(C, id)}</b> ${chordById(id).name.toLowerCase()} ${chordPlay(C, id)}`, 'sm');
    return [
      key('Un <b>acorde</b> se forma superponiendo notas de 3 en 3: <b>por terceras</b>. Puede ser <b>tríada</b> (3 notas) o <b>tétrada</b> (4 notas). Las extensiones 9, 11 y 13 <b>no cuentan</b> en el armado ni en el tipo de acorde.'),
      V.roleLegend([1, 3, 5, 7, 't']),
      box('Tríadas (3 notas)', `<p>Dos terceras apiladas; el tipo depende de cuáles (3M o 3m).</p>${vrow(...tri.map(st))}`),
      box('Tétradas (4 notas)', `<p>A la tríada se le suma otra tercera: la 7ma.</p>${vrow(...sev.map(st))}<details class="lmore"><summary>Más acordes (sus, 6, maj7(#5))</summary>${table(['Cifrado', 'Nombre', 'Fórmula', 'Notas', ''], more.map(row))}</details>`),
      box('Arpegios: esquema de la escala cromática', `<p>Las 12 notas, a un semitono cada una, en círculo: cada arpegio elige 3 o 4 y forma una figura.</p>
        ${vrow(fig(clockOf(C, chordById('maj7').intervals, { label: `${sym(C, 'maj7')} en el reloj` }), `<b>${sym(C, 'maj7')}</b>: 0 · 4 · 7 · 11`, 'sm'), fig(clockOf(C, chordById('m7').intervals, { label: `${sym(C, 'm7')} en el reloj` }), `<b>${sym(C, 'm7')}</b>: 0 · 3 · 7 · 10`, 'sm'), fig(clockOf(C, chordById('dim7').intervals, { label: `${sym(C, 'dim7')} en el reloj` }), `<b>${sym(C, 'dim7')}</b>: simétrico, todo 3m`, 'sm'))}
        ${chromatic()}`),
      box('Extensiones (no cambian el tipo)', `<p>Siguen apilando terceras sobre la 7ma: <b>9 = 2</b>, <b>11 = 4</b>, <b>13 = 6</b>. ${sym(C, 'maj9')} sigue siendo un acorde mayor 7.</p>${vrow(fig(stackOf(C, ['1', '3', '5', 'b7', '9', '13'], `${sym(C, '13')}`), `<b>${sym(C, '13')}</b> (sin la 11, que choca con la 3ra) ${chordPlay(C, '13')}`, 'sm'))}`),
      tip('en Información → Arpegios están las tríadas y tétradas con la tónica en el dedo 1; en Técnica → Formación de acordes, sus formas en el mástil.'),
    ].join('');
  },

  grados: () => {
    const maj = spellAll(C, scaleById('jonico').intervals);
    const modes = SCALES.filter((s) => s.fam === 'mayor' || s.id === 'menor-armonica' || s.id === 'menor-melodica');
    return [
      key('Cada nota de una escala es un <b>grado</b> (I a VII). El grado dice <b>qué función cumple</b> la nota, no solo cómo se llama.'),
      box(`Los grados de ${nn(C)} mayor`, `${degStrip(maj.map((n, i) => ({ top: ROMAN7[i], mid: nn(n), bot: DEG_NAMES[i] })))}${vrow(fig(stepsOf(C, 'jonico'), `${nn(C)} mayor ${play(asc([...maj, C]), 'seq', 'Do mayor')}`, 'wide'))}`),
      box('Detectar una escala', `<ol><li>Ubicá la <b>tónica</b> (reposo; suele empezar y terminar).</li><li>Sacá la <b>fórmula</b>: el intervalo de cada nota.</li><li>Buscá la <b>nota característica</b>.</li></ol>
        ${table(['Escala', 'Fórmula', 'Nota característica'], modes.map((s) => [`<b>${s.name}</b>`, s.intervals.join(' '), esc(s.char || '')]))}`),
      box('Tonalidad a partir de acordes', `<p>Hay <b>un solo V7</b> por tonalidad mayor: si aparece ${nn(note(4))}7 con acordes de ${nn(C)}, la tónica es ${nn(C)} (una 5ta abajo).</p>`),
    ].join('');
  },

  'oido-funcional': () => {
    const cad = [[48, 52, 55, 60], [53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 60]];
    const maj = spellAll(C, scaleById('jonico').intervals);
    const T = [['Reposo', '—', '#2C6DB5'], ['Suspendido', '→ 1', '#CE3468'], ['Estable', '—', '#2C6DB5'], ['Tenso', '→ 3', '#CE3468'], ['Estable', '—', '#2C6DB5'], ['Inestable', '→ 5', '#CE3468'], ['Sensible', '→ 1', '#CE3468']];
    return [
      key('Reconocer cada nota <b>por su relación con la tónica</b>: primero una cadencia fija la tonalidad, después suena una nota.'),
      box('La cadencia I – IV – V – I', `<p>Fija la tonalidad: el V lleva la sensible que pide volver a la tónica. <button class="plain sm" data-cad="1">Escuchar en ${nn(C)}</button></p>`),
      box('Cómo suena cada grado', `${degStrip(maj.map((n, i) => ({ top: i + 1, mid: T[i][0], bot: T[i][1], color: T[i][2] })))}<p class="viz-legend"><span><i style="background:#2C6DB5"></i>Estable</span><span><i style="background:#CE3468"></i>Tiende a resolver</span></p>`),
      box('Método', `<ol><li>Cantá la tónica después de la cadencia.</li><li>Cantá el camino de la nota a la tónica, por grados.</li><li>Contá los pasos: ese es el grado.</li></ol><p class="lsmall">Orden: grados 1–3, después 1–5, toda la escala y por último los cromáticos.</p>`),
    ].join('') + `<script type="text/x-cad">${JSON.stringify(cad)}</script>`;
  },

  funciones: () => {
    const J = scaleById('jonico').intervals;
    const fnRows = MAJOR_FUNCTIONS.map((f) => {
      const r = transpose(C, J[f.deg]);
      return [`<b class="fn-${f.fn[0].toLowerCase()}">${f.roman}</b>`, sym(r, f.chord), scaleById(f.scale).name, f.tensions.join(', '), f.avoid.join(', ') || '—'];
    });
    const dia = (id) => diatonic(scaleById(id).intervals).map((d) => {
      const r = transpose(note(5), d.iv);
      return `<span class="dch"><b>${nn(r)}${d.chord.sym}</b><small>${d.roman}</small></span>`;
    }).join('');
    const strip = degStrip(MAJOR_FUNCTIONS.map((f) => ({ top: f.roman.replace(/(maj7|m7\(b5\)|m7|7)$/, ''), mid: sym(transpose(C, J[f.deg]), f.chord), bot: f.fn, color: V.FN_COLOR[f.fn] })));
    const marks = [
      { pos: 0, color: V.FN_COLOR.Tónica }, { pos: 0, ring: 'in', color: V.FN_COLOR.Tónica }, { pos: 1, ring: 'in', color: V.FN_COLOR.Tónica },
      { pos: 11, color: V.FN_COLOR.Subdominante }, { pos: 11, ring: 'in', color: V.FN_COLOR.Subdominante }, { pos: 1, color: V.FN_COLOR.Dominante },
    ];
    return [
      key('Cada acorde cumple una <b>función</b>: <b class="fn-t">tónica</b> (reposo), <b class="fn-s">subdominante</b> (alejamiento) o <b class="fn-d">dominante</b> (tensión).'),
      box(`Funciones en ${nn(C)} mayor`, `${strip}${vrow(fig(fifthsSvg({ marks, arrows: [[1, 0, V.FN_COLOR.Dominante]], label: 'Funciones en el círculo de quintas' }), `La tónica arriba, el IV a la izquierda y el V a la derecha`,))}`),
      box('Tensiones según la función', `${table(['Grado', 'Acorde', 'Escala', 'Tensiones', 'A evitar'], fnRows)}<p class="lsmall">Criterio Berklee. Nota a evitar: la que queda un semitono arriba de una nota del acorde (la 11 sobre Imaj7 o V7).</p>`),
      box('Acorde extendido según su función', `<p>Imaj7 → Imaj9, I6/9 · IIm7 → IIm9, IIm11 · V7 → V9, V13 · VIm7 → VIm9.</p>`),
      box(`Menores (en ${nn(note(5))})`, `<p><b>Armónica</b></p><div class="ds">${dia('menor-armonica')}</div><p><b>Melódica</b></p><div class="ds">${dia('menor-melodica')}</div>`),
    ].join('');
  },

  extensiones: () => {
    const rows = superimpositions(0, scaleById('jonico').intervals).filter((s) => s.deg > 0).map((s) => {
      const r = transpose(C, s.rootIv);
      return [`<b>${nn(r)}${s.chord.sym}</b>`, `desde la ${s.rootIv}`, s.tones.join(' – '), s.tones.includes('11') ? 'trae la 11 (a evitar)' : ''];
    });
    const ivs = ['1', '3', '5', '7', '9', '11', '13'];
    return [
      key('Las extensiones son las notas de la escala que siguen <b>apilando terceras</b> arriba de la 7ma. Para tocarlas: <b>superponer otro arpegio</b>.'),
      box(`Apilado completo sobre ${sym(C, 'maj7')}`, `${vrow(fig(stackOf(C, ivs, `${nn(C)} jónico apilado por terceras`), `1-3-5-7 es el acorde; 9-11-13 son tensiones. Desde la 3ra sale ${nn(note(2))}m7 (3-5-7-9).`, 'sm'))}`),
      box('Arpegios superpuestos', table(['Arpegio', 'Desde', 'Aporta', ''], rows)),
      tip('en Información → Arpegios están las tétradas para superponer; la ficha de cada escala lista sus arpegios superpuestos.'),
    ].join('');
  },

  secundarios: () => {
    const J = scaleById('jonico').intervals;
    const rows = SECONDARY.map((s) => {
      const tgt = transpose(C, J[s.target]);
      const dom = transpose(tgt, '5');
      return [`<b>${s.id.replace('V/', 'V7/')}</b>`, `${nn(dom)}7`, nn(tgt) + diatonic(J)[s.target].chord.sym, scaleById(s.scale).name, s.tensions.join(', '), chordPlay(dom, '7')];
    });
    const targets = SECONDARY.map((s) => transpose(C, J[s.target]));
    const arrows = targets.map((t) => [posOf(transpose(t, '5')), posOf(t), V.ROLE[3]]);
    const marks = [{ pos: 0, color: '#1E1E1E' }, ...targets.map((t) => ({ pos: posOf(t), color: '#2C6DB5' }))];
    return [
      key('Un dominante secundario es el <b>V7 de un acorde que no es la tónica</b>: lo prepara como una tónica momentánea.'),
      box('Cómo se arma', `<ol><li>Elegí el destino (II, III, IV, V o VI).</li><li>Subí una <b>5ta justa</b>: esa es la fundamental.</li><li>Armá un <b>7</b>: su 3ra es la sensible del destino.</li></ol>
        ${vrow(fig(fifthsSvg({ marks, arrows, label: 'Dominantes secundarios en el círculo de quintas' }), `Cada flecha: V7 → su destino, una 5ta abajo (un paso en el círculo)`,))}<p class="lsmall">No hay V7/VII: el VII es disminuido.</p>`),
      box(`En ${nn(C)} mayor`, `${table(['Función', 'Acorde', 'Resuelve a', 'Escala', 'Tensiones', ''], rows)}<p class="lsmall">Si el destino es menor (II, III, VI) aparecen b9 y/o b13.</p>`),
      box('II – V relativo', `<p>Cada secundario puede llevar su propio II: ${nn(note(2))}m7 – ${nn(note(5))}7 → ${nn(note(1))}m7.</p>`),
    ].join('');
  },

  tritono: () => {
    const G = note(4);
    const sub = tritoneSub(G);
    const J = scaleById('jonico').intervals;
    const rows = [['V7', G, C], ...SECONDARY.map((s) => [s.id.replace('V/', 'V7/'), transpose(transpose(C, J[s.target]), '5'), transpose(C, J[s.target])])].map(([fn, dom, tgt]) => {
      const sv = tritoneSub(dom);
      return [`<b>${fn}</b>`, `${nn(dom)}7`, `<b>${nn(sv)}7</b>`, nn(tgt), chordPlay(sv, '7')];
    });
    // reloj desde Sol: Sol7 (rol por color) + Reb7 (violeta); 3ra y 7ma compartidas con línea punteada
    const g7 = ['1', '3', '5', 'b7'].map((iv) => ({ k: ivSemis(iv), name: nn(transpose(G, iv)), iv, color: V.ROLE[V.roleOf(iv)] }));
    const db7 = ['b5', 'b2'].map((iv) => ({ k: ivSemis(iv), name: nn(transpose(G, iv)), color: V.ROLE.t }));
    const ck = V.clock([...g7, ...db7], { pairs: [[4, 10, V.ROLE[3]]], polygon: false, label: `${sym(G, '7')} y ${sym(sub, '7')} comparten el tritono` });
    return [
      key(`La sustitución tritonal reemplaza un V7 por el <b>dominante a un tritono</b>: ${sym(G, '7')} → ${sym(sub, '7')}.`),
      box('Por qué funciona', `<p>Comparten el <b>tritono</b> (3ra y 7ma) con los papeles cambiados. Resuelve <b>por semitono</b>: ${sym(sub, '7')} → ${sym(C, 'maj7')}.</p>
        ${vrow(fig(ck, `Punteado: el tritono ${nn(note(6))}–${nn(note(3))} compartido. Violeta: lo que agrega ${sym(sub, '7')}.`, 'sm'),
          fig(fifthsSvg({ marks: [{ pos: 0, color: '#1E1E1E' }, { pos: 1, color: V.FN_COLOR.Dominante }, { pos: 7, color: V.ROLE.t }], arrows: [[1, 0, V.FN_COLOR.Dominante], [7, 0, V.ROLE.t]], label: 'V7 y subV7 en el círculo de quintas' }), `En el círculo, el subV7 está enfrente del V7`,))}`),
      box(`subV7 en ${nn(C)} mayor`, table(['Reemplaza a', 'Dominante', 'subV7', 'Resuelve a', ''], rows)),
      box('Escala', `<p>Sobre el subV7: <b>Lidio dominante</b> (9, #11, 13), mismas notas que la <b>Alterada</b> del dominante original.</p>`),
    ].join('');
  },

  intercambio: () => {
    const rows = BORROWED.map((b) => {
      const r = fromTonic(C, b.semis, b.step);
      return [`<b>${b.roman}</b>`, sym(r, b.chord), MODE_NAMES_FROM[b.from] || b.from, scaleById(b.scale).name, b.note ? `<small>${b.note}</small>` : '', chordPlay(r, b.chord)];
    });
    return [
      key(`El intercambio modal usa acordes de un <b>modo paralelo</b> (misma tónica): en ${nn(C)} mayor se toman acordes de ${nn(C)} menor, dórico, mixolidio…`),
      box('Mayor y menor paralelos', `<p>En naranja, las notas que trae ${nn(C)} menor: con ellas se arman los acordes prestados.</p>
        ${vrow(fig(stepsOf(C, 'jonico'), `${nn(C)} mayor`, 'wide'), fig(stepsOf(C, 'eolico', ['b3', 'b6', 'b7']), `${nn(C)} menor`, 'wide'))}
        <p>El más común: la <b>subdominante menor</b> (IVm7, IVm6, bVImaj7, bVII7), todos con la b6.</p>`),
      box(`Acordes prestados en ${nn(C)} mayor`, table(['Grado', 'Acorde', 'Viene de', 'Escala', '', ''], rows)),
    ].join('');
  },

  impro: () => {
    const NAMES = { maj7: 'maj7', '7': '7', m7: 'm7', m7b5: 'm7(b5)', dim7: '°7', mMaj7: 'm(maj7)', maj7s5: 'maj7(#5)' };
    const rows = Object.entries(NAMES).map(([id, s]) => [`<b>${s}</b>`, IMPRO[id].scales.map((x) => scaleById(x)?.name).filter(Boolean).join(' · '), IMPRO[id].tensions.join(', ')]);
    const ivs = ['1', '9', '3', '11', '5', '13', '7'];
    const ck = clockOf(C, ['1', '2', '3', '4', '5', '6', '7'], {
      label: `${sym(C, 'maj7')} con ${nn(C)} jónico: notas del acorde, tensiones y nota a evitar`,
      color: (iv) => (iv === '4' ? V.ROLE.x : ['2', '6'].includes(iv) ? V.ROLE.t : V.ROLE[V.roleOf(iv)]),
    });
    return [
      key('Improvisar con criterio: elegir <b>qué notas tocar sobre cada acorde</b> según su tipo y su función.'),
      box('Orden de prioridad', `${vrow(fig(ck, `Sobre ${sym(C, 'maj7')}: 1 3 5 7 de apoyo, 9 y 13 color, la 4 (11) solo de paso`, 'sm'))}
        <p class="viz-legend"><span><i style="background:#1E1E1E"></i>Tónica</span><span><i style="background:#E07A1F"></i>3ra</span><span><i style="background:#2C6DB5"></i>5ta</span><span><i style="background:#2E9A5F"></i>7ma</span><span><i style="background:#8E4CC0"></i>Tensión</span><span><i style="background:#9a9aa3"></i>A evitar</span></p>
        <ol><li><b>Notas del acorde</b> en los tiempos fuertes.</li><li><b>Tensiones</b> para dar color.</li><li><b>Notas a evitar</b> solo de paso.</li></ol>`),
      box('Recursos sobre un acorde', `<ul><li><b>La escala</b> según la función (V7 → Mixolidio, subV7 → Lidio dominante).</li><li><b>Pentatónicas</b> dentro de esa escala.</li><li><b>Arpegios superpuestos</b> desde la 3ra, 5ta o 7ma.</li></ul>`),
      box('Escalas por tipo de acorde', table(['Acorde', 'Escalas (la primera es la habitual)', 'Tensiones'], rows)),
      tip('el Explorador muestra todo esto para cada acorde de una tonalidad, con enlaces al mástil.'),
    ].join('');
  },
};

export const hasLesson = (id) => !!L[id];
export function lessonHtml(id) {
  return `<article class="lesson">${L[id]()}</article>`;
}
