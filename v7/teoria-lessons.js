// Explicaciones ("Teoría") de cada ejercicio. Las tablas se generan con theory.js, así coinciden con lo que se practica.
import {
  note, noteName, notePc, transpose, chordById, scaleById, SCALES, diatonic, MAJOR_FUNCTIONS, SECONDARY, BORROWED,
  fromTonic, tritoneSub, superimpositions, IMPRO, INTERVALS, intervalLong, idToFormula, spellAll, MODE_NAMES_FROM, ivSemis, spellingsOf, intervalBetween,
} from './theory.js';
import { prefs, esc } from './ui.js';
import * as V from './viz.js';
import * as Gt from './guitar.js';

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
// figura de guitarra: el mástil con su explicación
const gfig = (svg, cap) => fig(svg, `<span><b>En la guitarra:</b> ${cap}</span>`, 'neckf');
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
        ${vrow(gfig(Gt.intervalShape(D, 'b3', { s: 5 }), `cada traste es un semitono. ${nn(D)} (5ta cuerda, traste 5) a ${nn(F)}: 3 trastes en la misma cuerda, o dos trastes atrás en la cuerda siguiente.`))}
        <p>Las alteraciones <b>no cambian el nombre</b>: de ${nn(B)} a ${nn(Fs)} hay 5 notas, es una <b>quinta</b> (con o sin el #).</p>
        ${vrow(fig(V.ruler([B, C, D, E, Fs].map(nn), 7, { label: `${nn(B)} a ${nn(Fs)}: 5 notas, quinta`, name: 'quinta' }), `${nn(B)} – ${nn(Fs)} ${play([59, 66], 'seq', `${nn(B)} ${nn(Fs)}`)}`, 'wide'))}
        ${vrow(gfig(Gt.intervalShape(B, '5', { s: 5 }), `la 5ta justa es la forma del <i>power chord</i>: dos trastes adelante en la cuerda siguiente (o 7 trastes en la misma).`))}`),
      box('2 · Género del intervalo', `<p>Los tonos y semitonos dan el <b>color</b>. Misma tercera, distinto género:</p>
        ${vrow(fig(Gt.intervalShape(C, '3', { s: 5 }), `<b>${nn(C)} – ${nn(E)}</b>: 4 trastes (2 tonos) = tercera mayor. En la cuerda siguiente, un traste atrás. ${play([48, 52], 'seq', 'tercera mayor')}`, 'neckf'),
          fig(Gt.intervalShape(C, 'b3', { s: 5 }), `<b>${nn(C)} – ${nn(Eb)}</b>: 3 trastes (1 tono y medio) = tercera menor. En la cuerda siguiente, dos trastes atrás. ${play([48, 51], 'seq', 'tercera menor')}`, 'neckf'))}`),
      box('Tipos de intervalos', `<p><b>1, 4, 5, 8</b>: justos (J). <b>2, 3, 6, 7</b>: mayores (M) o menores (m). Un semitono más: aumentado (A); uno menos: disminuido (d).</p>
        ${table(['Intervalo', 'Nombre', 'Semitonos', 'Tonos', `Desde ${nn(C)}`, ''], rows)}
        ${vrow(gfig(Gt.intervalMap(C, { s: 6 }), `el mapa de intervalos desde ${nn(C)} (6ta cuerda, traste 8). Cada intervalo tiene una <b>forma fija</b>: movés la tónica y la forma viaja con ella.`))}`),
      box('Enarmonía', `<p>${nn(D)}–${nn(Fs)} (3M) y ${nn(D)}–${nn(note(4, -1))} (4d) <b>suenan igual</b> pero se escriben distinto: la <b>letra</b> define el intervalo.</p>
        ${vrow(gfig(Gt.neck([{ s: 5, f: 5, label: nn(D), color: V.ROLE[1] }, { s: 4, f: 4, label: `${nn(Fs)}/${nn(note(4, -1))}`, color: Gt.ORANGE }], { label: 'Enarmonía en el mástil', lines: [[0, 1, Gt.ORANGE]] }), `es el <b>mismo traste</b>: en la guitarra no hay diferencia; la escritura depende de la tonalidad.`))}`),
      box('Inversión', `<div class="inv"><span>2 ↔ 7</span><span>3 ↔ 6</span><span>4 ↔ 5</span><span>M ↔ m</span><span>A ↔ d</span><span>J = J</span></div><p class="lsmall">Suman 9. Ej.: ${nn(C)}–${nn(E)} es 3M; ${nn(E)}–${nn(C)} es 6m.</p>
        ${vrow(gfig(Gt.neck([{ s: 5, f: 3, label: nn(C), color: V.ROLE[1] }, { s: 4, f: 2, label: nn(E), color: V.ROLE[3] }, { s: 3, f: 5, label: nn(C), color: V.ROLE[1] }], { label: 'Inversión en el mástil', lines: [[0, 1, V.ROLE[3]], [1, 2, '#2C6DB5']] }), `${nn(C)}→${nn(E)} sube una 3M; desde ese ${nn(E)} hasta el ${nn(C)} de la octava hay una 6m. Las dos formas juntas arman la octava.`))}`),
      tip('en una cuerda, cada traste es un semitono (3M = 4 trastes, 5J = 7). Entre cuerdas vecinas hay una 4J (mismo traste, cuerda siguiente), salvo Sol–Si, que es una 3M: por eso todas las formas se corren un traste al cruzar de la 3ra a la 2da cuerda.'),
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
        ${vrow(fig(stepsOf(C, 'jonico'), `${nn(C)} mayor ${sPlay(C, 'jonico')}`, 'wide'), fig(stepsOf(G, 'jonico', ['7']), `${nn(G)} mayor ${sPlay(G, 'jonico')}`, 'wide'))}
        ${vrow(fig(Gt.position(C, scaleById('jonico').intervals), `${nn(C)} mayor desde la 6ta cuerda, traste 8`, 'neckf'), fig(Gt.position(G, scaleById('jonico').intervals, { mark: ['7'] }), `${nn(G)} mayor: <b>la misma figura</b>, 5 trastes más abajo`, 'neckf'))}
        <p class="lsmall"><b>En la guitarra:</b> cambiar de tonalidad es <b>mover la figura</b> hasta la nueva tónica. La forma de los dedos no cambia.</p>`),
      box('Las 4 escalas principales', `<p><b>T</b> tono · <b>st</b> semitono · <b>T+st</b> tono y medio. En naranja, las notas que cambian respecto de la menor natural.</p>
        ${vrow(...MAIN.map(([id, name, root, mk]) => fig(stepsOf(root, id, mk), `<b>${name}</b> · ${scheme(scaleById(id).intervals).join(' ')} ${sPlay(root, id)}`, 'wide')))}
        ${vrow(gfig(Gt.oneString(C, [...scaleById('jonico').intervals, '8'], { s: 5 }), `${nn(C)} mayor en una sola cuerda: <b>T = 2 trastes</b>, <b>st = 1 traste</b>. El esquema se ve como saltos de traste.`))}
        ${vrow(...MAIN.map(([id, name, root, mk]) => fig(Gt.position(root, scaleById(id).intervals, { mark: mk }), `<b>${name}</b> en una posición${mk.length ? ': en naranja, lo que cambia' : ''}`, 'neckf')))}`),
      box('Armado de una escala', `<ol><li>Escribí <b>7 notas consecutivas, sin alteraciones</b>, desde la tónica.</li><li>Medí cada distancia y comparala con el <b>esquema</b>.</li><li><b>Ajustá</b>: # sube medio tono, b baja medio tono.</li></ol>
        ${buildExample(C, 'jonico', `${nn(C)} mayor`)}
        ${buildExample(A, 'eolico', `${nn(A)} menor`)}
        ${buildExample(A, 'menor-armonica', `${nn(A)} menor armónica`)}
        ${buildExample(G, 'jonico', `${nn(G)} mayor`)}
        ${vrow(gfig(Gt.oneString(G, [...scaleById('jonico').intervals, '8'], { s: 6, mark: ['7'] }), `${nn(G)} mayor en la 6ta cuerda: si tocás T T st T T T st desde el traste 3, el séptimo grado cae en el ${nn(note(3, 1))} (traste 14). El esquema "arma" la escala solo.`))}`),
      box('Otras escalas que se practican', `${table(['Escala', 'Fórmula', 'Ejemplo', ''], others)}
        ${vrow(...['penta-mayor', 'penta-menor', 'blues', 'blues-mayor'].map((id) => { const sc = scaleById(id); const root = sc.offset === 9 ? A : C; return fig(Gt.position(root, sc.intervals, { mark: id === 'blues' ? ['b5'] : id === 'blues-mayor' ? ['b7'] : [] }), `<b>${sc.name}</b>${id === 'blues' ? ': la b5 (blue note) en naranja' : id === 'blues-mayor' ? ': la b7 (nota mixolidia) en naranja' : ''}`, 'neckf'); }))}`),
    ].join('');
  },

  acordes: () => {
    const tri = ['mayor', 'menor', 'dim', 'aum'];
    const sev = ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'];
    const more = ['sus2', 'sus4', 'maj7s5', '6', 'm6'];
    const row = (id) => { const c = chordById(id); return [`<b>${sym(C, id)}</b>`, c.name, c.intervals.join(' '), spellAll(C, c.intervals).map(nn).join(' '), chordPlay(C, id)]; };
    const st = (id) => fig(stackOf(C, chordById(id).intervals, `${sym(C, id)}: ${spellAll(C, chordById(id).intervals).map(nn).join(' ')}`), `<b>${sym(C, id)}</b> ${chordById(id).name.toLowerCase()} ${chordPlay(C, id)}`, 'sm');
    // en la guitarra: una nota por cuerda desde la 6ta, cada tercera en la cuerda siguiente
    const gst = (id) => fig(Gt.stacked(C, chordById(id).intervals, { s0: 6, from: 1, to: 8 }), `<b>${sym(C, id)}</b>`, 'neckf half');
    return [
      key('Un <b>acorde</b> se forma superponiendo notas de 3 en 3: <b>por terceras</b>. Puede ser <b>tríada</b> (3 notas) o <b>tétrada</b> (4 notas). Las extensiones 9, 11 y 13 <b>no cuentan</b> en el armado ni en el tipo de acorde.'),
      V.roleLegend([1, 3, 5, 7, 't']),
      box('Tríadas (3 notas)', `<p>Dos terceras apiladas; el tipo depende de cuáles (3M o 3m).</p>${vrow(...tri.map(st))}
        <p class="lsmall"><b>En la guitarra:</b> cada tercera va a la cuerda siguiente, uno o dos trastes atrás (3M: uno; 3m: dos). Compará cómo se mueve una sola nota de un tipo a otro.</p>
        <div class="neck-grid">${tri.map(gst).join('')}</div>`),
      box('Tétradas (4 notas)', `<p>A la tríada se le suma otra tercera: la 7ma.</p>${vrow(...sev.map(st))}
        <p class="lsmall"><b>En la guitarra:</b> la 7ma cae en la 3ra cuerda. maj7 y 7 difieren en un traste; m7 y m7(b5), también.</p>
        <div class="neck-grid">${sev.map(gst).join('')}</div><details class="lmore"><summary>Más acordes (sus, 6, maj7(#5))</summary>${table(['Cifrado', 'Nombre', 'Fórmula', 'Notas', ''], more.map(row))}</details>`),
      box('Arpegios: esquema de la escala cromática', `<p>Las 12 notas, a un semitono cada una, en círculo: cada arpegio elige 3 o 4 y forma una figura.</p>
        ${vrow(fig(clockOf(C, chordById('maj7').intervals, { label: `${sym(C, 'maj7')} en el reloj` }), `<b>${sym(C, 'maj7')}</b>: 0 · 4 · 7 · 11`, 'sm'), fig(clockOf(C, chordById('m7').intervals, { label: `${sym(C, 'm7')} en el reloj` }), `<b>${sym(C, 'm7')}</b>: 0 · 3 · 7 · 10`, 'sm'), fig(clockOf(C, chordById('dim7').intervals, { label: `${sym(C, 'dim7')} en el reloj` }), `<b>${sym(C, 'dim7')}</b>: simétrico, todo 3m`, 'sm'))}
        ${chromatic()}
        ${vrow(gfig(Gt.oneString(C, ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7', '8'], { s: 5, label: 'iv', color: (iv) => (['1', '3', '5', '7', '8'].includes(iv) ? V.ROLE[V.roleOf(iv)] : '#d3d3d9') }), `la escala cromática es la cuerda entera: 12 trastes hasta la octava. En color, ${sym(C, 'maj7')} (trastes 0 · 4 · 7 · 11 desde la tónica).`))}
        ${vrow(fig(Gt.chordNeck(C, chordById('maj7'), { lo: 6 }), `<b>${sym(C, 'maj7')}</b> en una posición`, 'neckf'), fig(Gt.chordNeck(C, chordById('m7'), { lo: 6 }), `<b>${sym(C, 'm7')}</b> en la misma zona: la 3ra y la 7ma bajan un traste`, 'neckf'))}`),
      box('Extensiones (no cambian el tipo)', `<p>Siguen apilando terceras sobre la 7ma: <b>9 = 2</b>, <b>11 = 4</b>, <b>13 = 6</b>. ${sym(C, 'maj9')} sigue siendo un acorde mayor 7.</p>${vrow(fig(stackOf(C, ['1', '3', '5', 'b7', '9', '13'], `${sym(C, '13')}`), `<b>${sym(C, '13')}</b> (sin la 11, que choca con la 3ra) ${chordPlay(C, '13')}`, 'sm'))}
        ${vrow(gfig(Gt.stacked(C, ['1', '3', '5', 'b7', '9', '13'], { s0: 6 }), `${sym(C, '13')} por terceras en las 6 cuerdas: la 9 cae en la 2da cuerda y la 13 en la 1ra.`))}`),
      tip('en Información → Arpegios están las tríadas y tétradas con la tónica en el dedo 1; en Técnica → Formación de acordes, sus formas en el mástil.'),
    ].join('');
  },

  grados: () => {
    const maj = spellAll(C, scaleById('jonico').intervals);
    const modes = SCALES.filter((s) => s.fam === 'mayor' || s.id === 'menor-armonica' || s.id === 'menor-melodica');
    return [
      key('Cada nota de una escala es un <b>grado</b> (I a VII). El grado dice <b>qué función cumple</b> la nota, no solo cómo se llama.'),
      box(`Los grados de ${nn(C)} mayor`, `${degStrip(maj.map((n, i) => ({ top: ROMAN7[i], mid: nn(n), bot: DEG_NAMES[i] })))}${vrow(fig(stepsOf(C, 'jonico'), `${nn(C)} mayor ${play(asc([...maj, C]), 'seq', 'Do mayor')}`, 'wide'))}
        ${vrow(gfig(Gt.position(C, scaleById('jonico').intervals, { label: 'iv' }), `los grados en una posición. La tónica (negro) aparece tres veces: ubicala primero y contá los grados desde ahí.`))}`),
      box('Detectar una escala', `<ol><li>Ubicá la <b>tónica</b> (reposo; suele empezar y terminar).</li><li>Sacá la <b>fórmula</b>: el intervalo de cada nota.</li><li>Buscá la <b>nota característica</b>.</li></ol>
        ${table(['Escala', 'Fórmula', 'Nota característica'], modes.map((s) => [`<b>${s.name}</b>`, s.intervals.join(' '), esc(s.char || '')]))}`),
      box('Tonalidad a partir de acordes', `<p>Hay <b>un solo V7</b> por tonalidad mayor: si aparece ${nn(note(4))}7 con acordes de ${nn(C)}, la tónica es ${nn(C)} (una 5ta abajo).</p>
        ${vrow(gfig(Gt.neck([{ s: 6, f: 3, label: 'V', color: V.FN_COLOR.Dominante }, { s: 5, f: 3, label: 'I', color: V.FN_COLOR.Tónica }], { label: 'V a I en el mástil', lines: [[0, 1, V.FN_COLOR.Dominante]], minFrets: 4 }), `si el V7 tiene la fundamental en la 6ta cuerda (${nn(note(4))}, traste 3), la tónica está en el <b>mismo traste, una cuerda más aguda</b> (${nn(C)}, 5ta cuerda).`))}`),
    ].join('');
  },

  'oido-funcional': () => {
    const cad = [[48, 52, 55, 60], [53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 60]];
    const maj = spellAll(C, scaleById('jonico').intervals);
    const T = [['Reposo', '—', '#2C6DB5'], ['Suspendido', '→ 1', '#CE3468'], ['Estable', '—', '#2C6DB5'], ['Tenso', '→ 3', '#CE3468'], ['Estable', '—', '#2C6DB5'], ['Inestable', '→ 5', '#CE3468'], ['Sensible', '→ 1', '#CE3468']];
    return [
      key('Reconocer cada nota <b>por su relación con la tónica</b>: primero una cadencia fija la tonalidad, después suena una nota.'),
      box('La cadencia I – IV – V – I', `<p>Fija la tonalidad: el V lleva la sensible que pide volver a la tónica. <button class="plain sm" data-cad="1">Escuchar en ${nn(C)}</button></p>`),
      box('Cómo suena cada grado', `${degStrip(maj.map((n, i) => ({ top: i + 1, mid: T[i][0], bot: T[i][1], color: T[i][2] })))}<p class="viz-legend"><span><i style="background:#2C6DB5"></i>Estable</span><span><i style="background:#CE3468"></i>Tiende a resolver</span></p>
        ${vrow(gfig(Gt.position(C, scaleById('jonico').intervals, { label: 'iv', color: (iv) => T[scaleById('jonico').intervals.indexOf(iv)][2] }), `los mismos colores en una posición de ${nn(C)} mayor. Tocá la cadencia, después una nota roja y resolvela a la azul más cercana: el oído y los dedos aprenden juntos.`))}`),
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
      box(`Funciones en ${nn(C)} mayor`, `${strip}${vrow(fig(fifthsSvg({ marks, arrows: [[1, 0, V.FN_COLOR.Dominante]], label: 'Funciones en el círculo de quintas' }), `La tónica arriba, el IV a la izquierda y el V a la derecha`,))}
        ${vrow(gfig(Gt.rootsNeck(C, MAJOR_FUNCTIONS.map((f) => ({ iv: J[f.deg], label: f.roman.replace(/(maj7|m7\(b5\)|m7|7)$/, ''), color: V.FN_COLOR[f.fn] }))), `las fundamentales de los 7 acordes en la zona del traste 8. I, IV y V forman una figura (I en la 6ta cuerda; IV y V en la 5ta) que es <b>igual en todas las tonalidades</b>.`))}`),
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
      box(`Apilado completo sobre ${sym(C, 'maj7')}`, `${vrow(fig(stackOf(C, ivs, `${nn(C)} jónico apilado por terceras`), `1-3-5-7 es el acorde; 9-11-13 son tensiones. Desde la 3ra sale ${nn(note(2))}m7 (3-5-7-9).`, 'sm'))}
        ${vrow(gfig(Gt.stacked(C, ['1', '3', '5', '7', '9', '13'], { s0: 6 }), `${sym(C, 'maj7')} con 9 y 13, una nota por cuerda. Tapá la 6ta cuerda: de la 5ta a la 2da queda ${nn(note(2))}m7, el arpegio superpuesto desde la 3ra.`),
          gfig(Gt.overlay(C, chordById('maj7').intervals, note(2), chordById('m7').intervals, { labelB: ['3', '5', '7', '9'], colorB: V.ROLE.t }), `${sym(C, 'maj7')} en una posición; los números muestran qué es cada nota de ${nn(note(2))}m7 sobre ${nn(C)}: 3, 5 y 7 ya están en el acorde; la 9 (contorno) es la nota nueva.`))}`),
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
        ${vrow(fig(fifthsSvg({ marks, arrows, label: 'Dominantes secundarios en el círculo de quintas' }), `Cada flecha: V7 → su destino, una 5ta abajo (un paso en el círculo)`,))}<p class="lsmall">No hay V7/VII: el VII es disminuido.</p>
        ${vrow(gfig(Gt.neck([{ s: 6, f: 5, label: nn(note(5)) + '7', color: V.ROLE[3] }, { s: 5, f: 5, label: nn(note(1)) + '7', color: V.ROLE[3] }, { s: 6, f: 3, label: nn(note(4)) + '7', color: V.FN_COLOR.Dominante }, { s: 5, f: 3, label: nn(C), color: '#1E1E1E' }], { label: 'Cadena de dominantes en el mástil', lines: [[0, 1, V.ROLE[3]], [1, 2, V.ROLE[3]], [2, 3, V.FN_COLOR.Dominante]] }), `la cadena ${nn(note(5))}7 → ${nn(note(1))}7 → ${nn(note(4))}7 → ${nn(C)} en zigzag: cada V7 resuelve al <b>mismo traste en la cuerda de arriba</b>, o <b>dos trastes atrás en la de abajo</b>.`))}`),
      box(`En ${nn(C)} mayor`, `${table(['Función', 'Acorde', 'Resuelve a', 'Escala', 'Tensiones', ''], rows)}<p class="lsmall">Si el destino es menor (II, III, VI) aparecen b9 y/o b13.</p>`),
      box('II – V relativo', `<p>Cada secundario puede llevar su propio II: ${nn(note(2))}m7 – ${nn(note(5))}7 → ${nn(note(1))}m7.</p>
        ${vrow(gfig(Gt.overlay(note(5), chordById('7').intervals, note(1), chordById('m7').intervals, { guides: [['3', '1'], ['b7', 'b3']] }), `relleno: ${nn(note(5))}7 (V7/II); contorno: ${nn(note(1))}m7 en la misma zona. La 3ra de ${nn(note(5))}7 (${nn(note(0, 1))}) sube un traste a ${nn(note(1))}, y la 7ma (${nn(note(4))}) baja dos trastes a ${nn(note(3))}, la 3ra de ${nn(note(1))}m7.`))}`),
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
      box('En la guitarra', `${vrow(gfig(Gt.tritoneNeck(G, sub), `${sym(G, '7')} (fundamental en la 6ta cuerda) y ${sym(sub, '7')} (en la 5ta, contorno) con 7ma y 3ra arriba: <b>las dos notas de arriba son las mismas</b>. Para sustituir, pasás el bajo a la 5ta cuerda, un traste adelante.`))}`),
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
        ${vrow(fig(Gt.position(C, scaleById('jonico').intervals, { lo: 6 }), `${nn(C)} mayor`, 'neckf'), fig(Gt.position(C, scaleById('eolico').intervals, { mark: ['b3', 'b6', 'b7'], lo: 6 }), `${nn(C)} menor en la <b>misma posición</b>: la b3, b6 y b7 (naranja) están un traste atrás de la 3, 6 y 7`, 'neckf'))}
        <p>El más común: la <b>subdominante menor</b> (IVm7, IVm6, bVImaj7, bVII7), todos con la b6.</p>`),
      box(`Acordes prestados en ${nn(C)} mayor`, `${table(['Grado', 'Acorde', 'Viene de', 'Escala', '', ''], rows)}
        ${vrow(gfig(Gt.overlay(note(3), chordById('mayor').intervals, note(3), chordById('menor').intervals, { colorB: Gt.ORANGE, lo: 6 }), `${nn(note(3))} (IV, relleno) y ${nn(note(3))}m (IVm prestado, contorno naranja): cambia una sola nota, la 3ra (${nn(note(5))} → ${nn(note(5, -1))}), un traste atrás. En las tétradas cambia también la 7ma: ${nn(note(3))}maj7 → ${nn(note(3))}m7.`))}`),
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
        <ol><li><b>Notas del acorde</b> en los tiempos fuertes.</li><li><b>Tensiones</b> para dar color.</li><li><b>Notas a evitar</b> solo de paso.</li></ol>
        ${vrow(gfig(Gt.scaleOnChord(C, scaleById('jonico'), chordById('maj7'), ['4']), `${nn(C)} jónico sobre ${sym(C, 'maj7')} en una posición, con los mismos colores: apoyá en las de color, pasá por las violetas y no te quedes en la gris (la 4).`))}`),
      box('Recursos sobre un acorde', `<ul><li><b>La escala</b> según la función (V7 → Mixolidio, subV7 → Lidio dominante).</li><li><b>Pentatónicas</b> dentro de esa escala.</li><li><b>Arpegios superpuestos</b> desde la 3ra, 5ta o 7ma.</li></ul>`),
      box('Escalas por tipo de acorde', `${table(['Acorde', 'Escalas (la primera es la habitual)', 'Tensiones'], rows)}
        ${vrow(fig(Gt.scaleOnChord(note(4), scaleById('mixolidio'), chordById('7'), ['4']), `${nn(note(4))} mixolidio sobre ${nn(note(4))}7`, 'neckf'), fig(Gt.scaleOnChord(note(1), scaleById('dorico'), chordById('m7')), `${nn(note(1))} dórico sobre ${nn(note(1))}m7`, 'neckf'))}`),
      tip('el Explorador muestra todo esto para cada acorde de una tonalidad, con enlaces al mástil.'),
    ].join('');
  },
};

export const hasLesson = (id) => !!L[id];
export function lessonHtml(id) {
  return `<article class="lesson">${L[id]()}</article>`;
}
