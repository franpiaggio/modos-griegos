// Explicaciones ("Teoría") de cada ejercicio. Las tablas se generan con theory.js, así coinciden con lo que se practica.
import {
  note, noteName, notePc, transpose, chordById, scaleById, SCALES, diatonic, MAJOR_FUNCTIONS, SECONDARY, BORROWED,
  fromTonic, tritoneSub, superimpositions, IMPRO, INTERVALS, intervalLong, idToFormula, spellAll, MODE_NAMES_FROM, ivSemis, spellingsOf,
} from './theory.js';
import { prefs, esc } from './ui.js';

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
const table = (head, rows) => `<div class="ltable"><table><thead><tr>${head.map((h) => `<th>${h || '<span class="sr">Escuchar</span>'}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const box = (title, body, cls = '') => `<section class="lbox ${cls}"><h2>${title}</h2>${body}</section>`;
const tip = (t) => `<p class="ltip"><b>En la guitarra:</b> ${t}</p>`;
const key = (t) => `<p class="lkey">${t}</p>`;

// "Re – Mi – Fa" numerado, para contar notas
const steps = (list) => list.map((n, i) => `${nn(n)}<sup>${i + 1}</sup>`).join(' – ');
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
  return `<div class="ltable build-ex"><table><caption>${title}</caption><tbody>
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
  return `<div class="ltable chroma"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div><p class="lsmall">Fila de arriba: nota (desde ${nn(C)}), intervalo y semitonos desde la tónica. Ejemplo: el arpegio mayor usa las casillas 0, 4 y 7 (1 – 3 – 5); el menor 7, las casillas 0, 3, 7 y 10 (1 – b3 – 5 – b7).</p>`;
}
const PREF_NAMES = (pc) => spellingsOf(pc).map(nn).join('/');

const DEG_NAMES = ['Tónica', 'Supertónica', 'Mediante', 'Subdominante', 'Dominante', 'Superdominante', 'Sensible'];

const L = {
  intervalos: () => {
    const rows = INTERVALS.filter((i) => !['2A', '3d', '6A', '4d', '7d', '5A'].includes(i.id)).map((i) => {
      const n = transpose(C, idToFormula(i.id));
      return [`<b>${i.id}</b>`, intervalLong(i.id), i.semis, tones(i.semis), `${nn(C)} – ${nn(n)}`, play([60, 60 + i.semis], 'seq', i.id)];
    });
    const D = note(1), F = note(3), A = note(5), B = note(6), E = note(2);
    return [
      key('El <b>intervalo</b> es la distancia entre dos sonidos o notas. Los intervalos se miden por la <b>distancia</b> en cantidad de notas que separan los sonidos que quiero medir, y se clasifican por su <b>género</b>: la cantidad de tonos o semitonos entre los sonidos a medir.'),
      box('1 · Distancia', `<p>Parto de una nota, por ejemplo ${nn(D)}, y necesito llegar a ${nn(F)}. De ${nn(D)} a ${nn(F)} tengo las notas ${steps([D, E, F])}: hay <b>3 notas</b>, por lo tanto ese intervalo se llama <b>tercera</b>.</p>
        <p><b>Nota:</b> las alteraciones (# o b) no interfieren en el nombre del intervalo. Si tengo que medir ${nn(B)} y ${nn(note(3, 1))}, cuento ${steps([B, C, D, E, note(3, 1)])}: al tener <b>5 notas</b> el intervalo se llama <b>quinta</b>, y no importa el # en ${nn(F)}. Sin el #, el resultado sería el mismo.</p>
        ${play([59, 66], 'seq', `${nn(B)} – ${nn(note(3, 1))}`)}`),
      box('2 · Género del intervalo', `<p>La cantidad de tonos y semitonos entre los sonidos da la <b>característica sonora</b> del intervalo.</p>
        <p>De ${nn(C)} a ${nn(E)} tengo una tercera de <b>2 tonos</b>: esa tercera se llama <b>tercera mayor</b>. ${play([60, 64], 'seq', 'tercera mayor')}</p>
        <p>De ${nn(C)} a ${nn(note(2, -1))} también hay una tercera, pero la distancia es de <b>un tono y medio</b>: es una <b>tercera menor</b>. ${play([60, 63], 'seq', 'tercera menor')}</p>`),
      box('Tipos de intervalos', `<p>Los intervalos de <b>1, 4, 5 y 8</b> son <b>justos</b> (J). Los de <b>2, 3, 6 y 7</b> son <b>mayores</b> (M) o <b>menores</b> (m). Un semitono más que el justo o el mayor es <b>aumentado</b> (A); uno menos que el justo o el menor es <b>disminuido</b> (d).</p>
        ${table(['Intervalo', 'Nombre', 'Semitonos', 'Tonos', `Desde ${nn(C)}`, ''], rows)}`),
      box('Enarmonía: suena igual, se escribe distinto', `<p>${nn(note(1))}–${nn(note(3, 1))} (3M) y ${nn(note(1))}–${nn(note(4, -1))} (4d) suenan igual (4 semitonos) pero son intervalos distintos, porque usan letras distintas. Por eso en los ejercicios la respuesta tiene que tener la <b>letra correcta</b>.</p>`),
      box('Inversión', `<p>Si la nota de abajo pasa arriba, el número se completa a 9 (3ra ↔ 6ta, 2da ↔ 7ma, 4ta ↔ 5ta) y la calidad se da vuelta: M ↔ m, A ↔ d, J sigue J. Ejemplo: ${nn(C)}–${nn(note(2))} es 3M; ${nn(note(2))}–${nn(C)} es 6m.</p>`),
      tip('en una misma cuerda cada traste es un semitono: una 3M son 4 trastes, una 5J son 7. Entre dos cuerdas vecinas hay una 4J (salvo Sol–Si, que es 3M).'),
    ].join('');
  },

  escalas: () => {
    const MAIN = [['jonico', 'Escala mayor', C], ['eolico', 'Escala menor', note(5)], ['menor-armonica', 'Menor armónica', note(5)], ['menor-melodica', 'Menor melódica', note(5)]];
    const rows = MAIN.map(([id, name, root]) => {
      const s = scaleById(id);
      const notes = spellAll(root, s.intervals);
      return [`<b>${name}</b>`, `<span class="scheme">${scheme(s.intervals).join(' ')}</span>`, s.intervals.join(' '), notes.map(nn).join(' '), play(asc([...notes, root]), 'seq', name)];
    });
    const others = ['penta-mayor', 'penta-menor', 'blues', 'blues-mayor'].map(scaleById).map((s) => {
      const root = s.offset === 9 ? note(5) : C;
      const notes = spellAll(root, s.intervals);
      return [`<b>${s.name}</b>`, s.intervals.join(' '), notes.map(nn).join(' '), play(asc([...notes, root]), 'seq', s.name)];
    });
    return [
      key('Una <b>escala</b> es un esquema de distancias entre sonidos y se define por los intervalos entre cada nota con respecto a la nota de partida (<b>tónica</b>).'),
      box('Escala y tonalidad no son lo mismo', `<p>Una <b>escala</b> es un esquema con identidad propia; una <b>tonalidad</b> es una variante de una escala.</p><p>Por ejemplo, la escala de ${nn(C)} mayor y la escala de ${nn(note(4))} mayor <b>no son escalas distintas</b>: son <b>tonalidades diferentes de la escala mayor</b>. Son variaciones de un mismo esquema de distancias.</p>`),
      box('Las 4 escalas principales', `<p><b>T</b> = tono · <b>st</b> = semitono · <b>T+st</b> = tono y medio.</p>${table(['Escala', 'Esquema', 'Fórmula', 'Ejemplo', ''], rows)}`),
      box('Armado de una escala', `<ol><li>Escribí <b>7 notas distintas y consecutivas, sin alteraciones</b>, empezando por la tónica.</li><li>Medí la distancia entre cada nota y comparala con el <b>esquema</b> de la escala que querés armar.</li><li><b>Ajustá con alteraciones</b> donde haga falta: el <b>#</b> aumenta medio tono a una nota y la <b>b</b> la disminuye medio tono.</li></ol>
        ${buildExample(C, 'jonico', `${nn(C)} mayor`)}
        ${buildExample(note(5), 'eolico', `${nn(note(5))} menor`)}
        ${buildExample(note(5), 'menor-armonica', `${nn(note(5))} menor armónica`)}
        ${buildExample(note(4), 'jonico', `${nn(note(4))} mayor`)}`),
      box('Otras escalas que se practican', table(['Escala', 'Fórmula', 'Ejemplo', ''], others)),
      tip('en Información están todas estas escalas en sus posiciones; la ficha (botón ⓘ) muestra la fórmula y las notas de cada una.'),
    ].join('');
  },

  acordes: () => {
    const tri = ['mayor', 'menor', 'dim', 'aum', 'sus2', 'sus4'];
    const sev = ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7', 'maj7s5', '6', 'm6'];
    const ext = ['add9', 'maj9', '9', 'm9', 'm11', 'maj7s11', '13', 'm7b9', '7s9'];
    const STRUCT = { mayor: '3M + 3m', menor: '3m + 3M', dim: '3m + 3m', aum: '3M + 3M', sus2: '2M + 4J', sus4: '4J + 2M' };
    const row = (id) => { const c = chordById(id); return [`<b>${sym(C, id)}</b>`, c.name, c.intervals.join(' '), spellAll(C, c.intervals).map(nn).join(' '), chordPlay(C, id)]; };
    return [
      key('Un <b>acorde</b> se forma por la superposición de notas de 3 en 3, es decir, <b>por terceras</b>. Los acordes mínimamente pueden ser <b>tríadas</b> (compuestos por 3 notas) o <b>tétradas</b> (compuestos por 4 notas). Las extensiones como 9, 11 y 13 <b>no cuentan</b> en el armado ni en las características del acorde.'),
      box('Tríadas (3 notas)', `<p>La calidad depende de qué terceras se apilan: ${tri.slice(0, 4).map((id) => `${chordById(id).name.toLowerCase()} = ${STRUCT[id]}`).join(' · ')}. Las sus reemplazan la 3ra por la 2da o la 4ta.</p>${table(['Cifrado', 'Nombre', 'Fórmula', 'Notas', ''], tri.map(row))}`),
      box('Tétradas (4 notas)', `<p>A la tríada se le suma otra tercera: la 7ma, mayor (7) o menor (b7). La disminuida lleva bb7 (suena como 6ta, pero se escribe como 7ma).</p>${table(['Cifrado', 'Nombre', 'Fórmula', 'Notas', ''], sev.map(row))}`),
      box('Arpegios: esquema de la escala cromática', `<p>Un <b>arpegio</b> es el acorde tocado nota por nota. Para armarlo sobre cualquier tónica sirve el esquema de la <b>escala cromática</b>: las 12 notas separadas por semitonos, cada una con su intervalo respecto de la tónica. Cada arpegio elige 3 (tríada) o 4 (tétrada) de esas casillas.</p>${chromatic()}`),
      box('Extensiones (no cambian el tipo de acorde)', `<p>Las tensiones son las notas de la escala una octava arriba: <b>9 = 2</b>, <b>11 = 4</b>, <b>13 = 6</b>. Se suman a la tétrada pero no cambian su tipo: ${sym(C, 'maj9')} sigue siendo un acorde mayor 7. En el 13 se omite la 11 (choca con la 3ra); el dominante con 11 se toca como 9sus4.</p>${table(['Cifrado', 'Nombre', 'Fórmula', 'Notas', ''], ext.map(row))}`),
      tip('en Información → Arpegios están las tríadas y las tétradas en sus posiciones (con la tónica en el dedo 1), y en Técnica → Formación de acordes, sus formas (CAGED, tríadas, drop 2 y drop 3).'),
    ].join('');
  },

  grados: () => {
    const maj = spellAll(C, scaleById('jonico').intervals);
    const modes = SCALES.filter((s) => s.fam === 'mayor' || s.id === 'menor-armonica' || s.id === 'menor-melodica');
    return [
      key('Cada nota de una escala es un <b>grado</b> (I a VII) según su distancia a la tónica. Conocer el grado de una nota es saber <b>qué función cumple</b>, no solo cómo se llama.'),
      box('Los grados de la escala mayor', table(['Grado', 'Nombre', `En ${nn(C)} mayor`], maj.map((n, i) => [`<b>${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]}</b>`, DEG_NAMES[i], nn(n)]))),
      box('Cómo detectar una escala a partir de sus notas', `<ol><li>Ubicá la <b>tónica</b>: suele ser la primera y la última nota, o la que da sensación de reposo.</li><li>Calculá el intervalo de cada nota respecto de la tónica y armá la <b>fórmula</b>.</li><li>Comparala con las fórmulas conocidas; alcanza con mirar la <b>nota característica</b> (la que la diferencia de las parecidas).</li></ol>
        ${table(['Escala', 'Fórmula', 'Nota característica'], modes.map((s) => [`<b>${s.name}</b>`, s.intervals.join(' '), esc(s.char || '')]))}`),
      box('Tonalidad a partir de acordes', `<p>En una tonalidad mayor hay <b>un solo V7</b> (el único dominante diatónico). Si aparece G7 junto con acordes de la escala de Do, la tonalidad es Do mayor: el V7 resuelve a la tónica una 5ta abajo.</p>`),
    ].join('');
  },

  'oido-funcional': () => {
    const cad = [[48, 52, 55, 60], [53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 60]];
    return [
      key('El oído funcional reconoce cada nota <b>por su relación con la tónica</b>, no por su nombre. Primero se escucha una cadencia que fija la tonalidad; después, una nota.'),
      box('La cadencia I – IV – V – I', `<p>Establece la tonalidad sin dudas: el V lleva la sensible que pide resolver a la tónica. Escuchala: <button class="plain sm" data-cad="1">Escuchar cadencia en ${nn(C)}</button></p>`),
      box('Cómo suena cada grado', table(['Grado', 'Sensación', 'Tiende a'], [
        ['<b>1</b>', 'Reposo total', '—'], ['<b>3</b>', 'Estable, define mayor o menor', '—'], ['<b>5</b>', 'Estable, abierto', '—'],
        ['<b>2</b>', 'Suspendido', 'bajar al 1'], ['<b>4</b>', 'Tenso, "colgado"', 'bajar al 3'], ['<b>6</b>', 'Dulce, inestable', 'bajar al 5'], ['<b>7</b>', 'Muy tenso (sensible)', 'subir al 1'],
      ])),
      box('Método', `<ol><li>Escuchá la cadencia y cantá la tónica.</li><li>Escuchá la nota y cantá el camino hasta la tónica (por grados).</li><li>Contá cuántos pasos diste: ese es el grado. Al responder, la app toca esa resolución.</li></ol><p>Empezá con los grados 1 a 3, después 1 a 5, la escala completa y por último los cromáticos (b2, b3, #4, b6, b7).</p>`),
    ].join('') + `<script type="text/x-cad">${JSON.stringify(cad)}</script>`;
  },

  funciones: () => {
    const fnRows = MAJOR_FUNCTIONS.map((f) => {
      const r = transpose(C, scaleById('jonico').intervals[f.deg]);
      return [`<b>${f.roman}</b>`, sym(r, f.chord), f.fn, scaleById(f.scale).name, f.tensions.join(', '), f.avoid.join(', ') || '—'];
    });
    const dia = (id) => diatonic(scaleById(id).intervals).map((d) => {
      const r = transpose(note(5), d.iv);
      return `<span class="dch"><b>${nn(r)}${d.chord.sym}</b><small>${d.roman}</small></span>`;
    }).join('');
    return [
      key('Cada acorde de la tonalidad cumple una <b>función</b>: <b>tónica</b> (reposo), <b>subdominante</b> (alejamiento) o <b>dominante</b> (tensión que pide resolver). La función decide qué extensiones suenan bien.'),
      box(`Acordes de ${nn(C)} mayor: función, escala y tensiones`, `${table(['Grado', 'Acorde', 'Función', 'Escala', 'Tensiones', 'A evitar'], fnRows)}<p class="lsmall">Criterio Berklee (chord-scale). Una <b>nota a evitar</b> es la que queda un semitono (b9) arriba de una nota del acorde, como la 11 sobre Imaj7 o V7. En IIm7, Berklee evita la 13 (forma tritono con la 3ra); otros autores la aceptan.</p>`),
      box('Acorde extendido según su función', `<p>Se suman al acorde de 7ma sus tensiones disponibles: Imaj7 → Imaj9 o I6/9 · IIm7 → IIm9, IIm11 · V7 → V9, V13 · VIm7 → VIm9, VIm11.</p>`),
      box(`Menor armónica y menor melódica (en ${nn(note(5))})`, `<p><b>Armónica:</b></p><div class="ds">${dia('menor-armonica')}</div><p><b>Melódica:</b></p><div class="ds">${dia('menor-melodica')}</div>`),
    ].join('');
  },

  extensiones: () => {
    const rows = superimpositions(0, scaleById('jonico').intervals).filter((s) => s.deg > 0).map((s) => {
      const r = transpose(C, s.rootIv);
      return [`<b>${nn(r)}${s.chord.sym}</b>`, `desde la ${s.rootIv}`, s.tones.join(' – '), s.tones.includes('11') ? 'trae la 11 (a evitar)' : ''];
    });
    return [
      key('Las extensiones (9, 11, 13) son las notas de la escala que siguen apilando terceras arriba de la 7ma. Una forma práctica de tocarlas es <b>superponer otro arpegio</b>.'),
      box('Superposición de arpegios', `<p>Un arpegio de 7ma armado desde la 3ra del acorde aporta 3 – 5 – 7 – <b>9</b>; desde la 5ta, 5 – 7 – 9 – 11; desde la 7ma, 7 – 9 – 11 – 13. Sobre ${sym(C, 'maj7')} (escala Jónico):</p>${table(['Arpegio', 'Desde', 'Aporta (sobre el acorde)', ''], rows)}`),
      box('Arpegios extendidos', `<p>${sym(C, 'maj9')} = ${spellAll(C, chordById('maj9').intervals).map(nn).join(' ')} · ${sym(note(1), 'm9')} = ${spellAll(note(1), chordById('m9').intervals).map(nn).join(' ')} · ${sym(note(4), '13')} = ${spellAll(note(4), chordById('13').intervals).map(nn).join(' ')}.</p>`),
      tip('en Información → Arpegios están las tétradas (con 7ma) que se superponen; la ficha de cada escala lista los arpegios superpuestos. Los arpegios extendidos se agregan más adelante.'),
    ].join('');
  },

  secundarios: () => {
    const rows = SECONDARY.map((s) => {
      const tgt = transpose(C, scaleById('jonico').intervals[s.target]);
      const dom = transpose(tgt, '5');
      return [`<b>${s.id.replace('V/', 'V7/')}</b>`, `${nn(dom)}7`, nn(tgt) + diatonic(scaleById('jonico').intervals)[s.target].chord.sym, scaleById(s.scale).name, s.tensions.join(', '), chordPlay(dom, '7')];
    });
    return [
      key('Un dominante secundario es el <b>V7 de un acorde que no es la tónica</b>. Lo prepara como si fuera una tónica momentánea (tonicización), sin cambiar de tonalidad.'),
      box('Cómo se arma', `<ol><li>Elegí el acorde de destino (II, III, IV, V o VI).</li><li>Subí una <b>5ta justa</b> desde su fundamental: esa es la fundamental del dominante.</li><li>Armá un acorde <b>7</b> (1 3 5 b7). Su 3ra funciona como sensible del destino.</li></ol><p>No hay V7/VII: el VII es disminuido y no puede funcionar como tónica.</p>`),
      box(`Dominantes secundarios en ${nn(C)} mayor`, `${table(['Función', 'Acorde', 'Resuelve a', 'Escala', 'Tensiones', ''], rows)}<p class="lsmall">Las tensiones salen de las notas de la tonalidad: si el destino es menor (II, III, VI) aparecen b9 y/o b13.</p>`),
      box('II – V relativo', `<p>Cada secundario puede estar precedido por su propio II: Mi m7 – La7 → Re m7 (II–V del II).</p>`),
    ].join('');
  },

  tritono: () => {
    const G = note(4);
    const sub = tritoneSub(G);
    const rows = [['V7', G, C], ...SECONDARY.map((s) => [s.id.replace('V/', 'V7/'), transpose(transpose(C, scaleById('jonico').intervals[s.target]), '5'), transpose(C, scaleById('jonico').intervals[s.target])])].map(([fn, dom, tgt]) => {
      const sv = tritoneSub(dom);
      return [`<b>${fn}</b>`, `${nn(dom)}7`, `<b>${nn(sv)}7</b>`, nn(tgt), chordPlay(sv, '7')];
    });
    return [
      key(`La sustitución tritonal reemplaza un V7 por <b>el dominante que está a un tritono</b> (3 tonos): ${sym(G, '7')} → ${sym(sub, '7')}.`),
      box('Por qué funciona', `<p>Los dos acordes comparten el <b>tritono</b> formado por la 3ra y la 7ma, con los papeles cambiados: en ${sym(G, '7')}, ${nn(note(6))} (3) y ${nn(note(3))} (b7); en ${sym(sub, '7')}, ${nn(note(3))} (3) y ${nn(note(0, -1))} = ${nn(note(6))} (b7). Ese tritono es lo que pide resolver.</p><p>El subV7 resuelve <b>por semitono descendente</b>: ${sym(sub, '7')} → ${sym(C, 'maj7')}.</p>`),
      box(`subV7 en ${nn(C)} mayor`, table(['Reemplaza a', 'Dominante', 'subV7', 'Resuelve a', ''], rows)),
      box('Escala', `<p>Sobre el subV7 se usa el <b>Lidio dominante</b> (tensiones 9, #11, 13). Tiene las mismas notas que la escala <b>Alterada</b> del dominante original.</p>`),
    ].join('');
  },

  intercambio: () => {
    const rows = BORROWED.map((b) => {
      const r = fromTonic(C, b.semis, b.step);
      return [`<b>${b.roman}</b>`, sym(r, b.chord), MODE_NAMES_FROM[b.from] || b.from, scaleById(b.scale).name, b.note ? `<small>${b.note}</small>` : '', chordPlay(r, b.chord)];
    });
    return [
      key(`El intercambio modal (préstamo modal) usa acordes de un <b>modo paralelo</b>, con la misma tónica: en ${nn(C)} mayor se toman acordes de ${nn(C)} menor, ${nn(C)} dórico, ${nn(C)} mixolidio, etc.`),
      box('Para qué se usa', `<p>Cambia el color sin cambiar de tonalidad. El caso más común es la <b>subdominante menor</b> (IVm7, IVm6, bVImaj7, bVII7…): todos llevan la b6 del modo menor y suelen ir antes de la tónica.</p>`),
      box(`Acordes prestados en ${nn(C)} mayor`, `${table(['Grado', 'Acorde', 'Viene de', 'Escala', '', ''], rows)}<p class="lsmall">La escala de cada acorde prestado sigue el criterio Berklee: conserva las notas de la tonalidad que no chocan con el acorde.</p>`),
    ].join('');
  },

  impro: () => {
    const NAMES = { maj7: 'maj7', '7': '7', m7: 'm7', m7b5: 'm7(b5)', dim7: '°7', mMaj7: 'm(maj7)', maj7s5: 'maj7(#5)' };
    const rows = Object.entries(NAMES).map(([id, s]) => [`<b>${s}</b>`, IMPRO[id].scales.map((x) => scaleById(x)?.name).filter(Boolean).join(' · '), IMPRO[id].tensions.join(', ')]);
    return [
      key('Improvisar con criterio es elegir <b>qué notas tocar sobre cada acorde</b>. El método chord-scale asigna a cada acorde una escala según su tipo y su función en la tonalidad.'),
      box('Orden de prioridad', `<ol><li><b>Notas del acorde</b> (1 3 5 7): son las notas de apoyo, en los tiempos fuertes.</li><li><b>Tensiones disponibles</b> (9, 11, 13 y sus alteraciones): dan color.</li><li><b>Notas a evitar</b>: solo de paso, nunca sostenidas.</li></ol>`),
      box('Recursos sobre un acorde', `<ul><li><b>La escala</b> (chord-scale) según la función: V7 → Mixolidio; V7/VI → Frigio dominante; subV7 → Lidio dominante, etc.</li><li><b>Pentatónicas</b> contenidas en esa escala: sobre ${sym(C, 'maj7')} entran ${nn(C)}, ${nn(note(4))} y ${nn(note(1))} pentatónica mayor (esta última da el sonido lidio).</li><li><b>Arpegios superpuestos</b> desde la 3ra, 5ta o 7ma, que suman extensiones.</li></ul>`),
      box('Escalas por tipo de acorde', table(['Acorde', 'Escalas (la primera es la habitual)', 'Tensiones posibles'], rows)),
      tip('el Explorador muestra todo esto para cada acorde de una tonalidad (diatónicos, secundarios, subV7 y prestados), con enlaces para ver cada escala en el mástil.'),
    ].join('');
  },
};

export const hasLesson = (id) => !!L[id];
export function lessonHtml(id) {
  return `<article class="lesson">${L[id]()}</article>`;
}
