// Ejercitación técnica: metrónomo, tocar sobre un acorde fijo, ejercicios por objetivo y formación de acordes.
import { store, prefs, onPrefs, toast, esc, ICON } from './ui.js';
import { icon } from './icons.js';
import * as audio from './audio.js';
import {
  scaleTitle, SCALES, CHORDS, EXTRA_SCALES, IMPRO, FAMILIES, build, noteName, PREF, transpose, bestRoot, ivSemis, chordById,
  superimpositions, toExt, rootLabel, midiOf, notePc,
} from './theory.js';
import { sheetSvg, layoutLegend, boxOf } from './render.js';
import { createMetronome, METERS, defaultAccents, tapper, tempoName } from './tecnica-metro.js';
import { EXERCISES, MANOS, OBJETIVOS, OBJ_NAME, MANO_NAME } from './tecnica-ejercicios.js';
import { parseTab, tabSvg, tabNotes } from './tecnica-tab.js';
import { PROGS, progression, guideTones, tritone, keyRoot } from './tecnica-vi.js';
import { fifths, keyboard, ROLE, roleOf, FN_COLOR, roleLegend } from './viz.js';
import { note as mkNote } from './theory.js';
import {
  cagedShapes, CAGED_TYPES, triadVoicings, TRIAD_TYPES, TRIAD_SETS, dropVoicings, SEVENTH_TYPES, DROP2_SETS, DROP3_SETS,
  chordBox, midiOfNote,
} from './tecnica-chords.js';

const mod = (n) => ((n % 12) + 12) % 12;
let root = null; // section#v-tecnica
let view = '';
let cleanup = []; // timers del view actual
const today = () => new Date().toISOString().slice(0, 10);
const nn = (n) => noteName(n, prefs.notation);
// Etiqueta de tónica para los chips: naturales solos y teclas negras con sus dos nombres (sin Si#, Fab, etc.)
const BLACK = new Set([1, 3, 6, 8, 10]);
const rootChip = (p) => (BLACK.has(p) ? `${nn(transpose(PREF[p - 1], '#1'))}/${nn(transpose(PREF[p + 1], 'b1'))}` : nn(PREF[p]));
// Ordena extensiones por grado: 7 9 11 13
const extOrder = (list) => [...list].sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));

// ---------------------------------------------------------------- metrónomo compartido
const hooks = { onVisual: null, onBeat: null, onBar: null, onStop: null };
const metro = createMetronome({
  onVisual: (...a) => hooks.onVisual?.(...a),
  onBeat: (...a) => hooks.onBeat?.(...a),
  onBar: (...a) => hooks.onBar?.(...a),
  onStop: () => hooks.onStop?.(),
});
let stopDrone = null;
function stopAll() {
  if (metro.running) metro.stop();
  stopDrone?.();
  stopDrone = null;
  audio.stop();
  cleanup.forEach((f) => f());
  cleanup = [];
  Object.keys(hooks).forEach((k) => (hooks[k] = null));
}

// ---------------------------------------------------------------- contrato del módulo
export function mount(el) {
  root = el;
  onPrefs(() => { if (document.body.dataset.sec === 'tecnica') redraw(); });
  window.addEventListener('keydown', (e) => {
    if (document.body.dataset.sec !== 'tecnica' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
    if (e.key === ' ' && !document.querySelector('#settings:not([hidden])')) {
      const btn = root.querySelector('[data-space]');
      if (btn) { e.preventDefault(); btn.click(); }
    }
  });
}
export function route(sub) {
  stopAll();
  view = sub || '';
  routeView();
}
export function leave() { stopAll(); }

let redraw = () => {};
function show(fn) {
  redraw = () => { fn(); };
  fn();
}
function routeView() {
  const [a, b] = view.split('/');
  if (a === 'metronomo') return show(viewMetro);
  if (a === 'acorde-escalas') return show(() => viewChord('escalas'));
  if (a === 'acorde-arpegios') return show(() => viewChord('arpegios'));
  if (a === 'ejercicios' && b) return show(() => viewExercise(b));
  if (a === 'ejercicios') return show(viewExercises);
  if (a === 'acordes') return show(viewVoicings);
  if (a === 'v-i') return show(viewVI);
  return show(viewHome);
}

// Encabezado igual al de Teoría: volver + sección + título; la portada usa la variante grande.
let crumb = ['Técnica', '#/tecnica'];
const back = (label = 'Técnica', href = '#/tecnica') => { crumb = [label, href]; return ''; };
const head = (title, sub, extra = '') => {
  const c = crumb;
  crumb = ['Técnica', '#/tecnica'];
  if (title === 'Ejercitación técnica') return `<header class="t-intro tc-intro"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</header>`;
  return `<header class="t-head tc-head2"><a class="ib" href="${c[1]}" aria-label="Volver a ${c[0]}">${ICON.back}</a><div class="t-title"><h1>${title}</h1></div>${extra}</header>${sub ? `<p class="tc-sub">${sub}</p>` : ''}`;
};

// ---------------------------------------------------------------- inicio
function viewHome() {
  const m = store.get('tec.metro', {});
  const logged = EXERCISES.map((ex) => [ex, store.get('tec.ex.' + ex.id, null)]).filter(([, s]) => s && s.best);
  const recent = logged.sort((a, b) => (b[1].last || '').localeCompare(a[1].last || '')).slice(0, 3);
  const cards = [
    ['metronomo', 'Metrónomo', 'Acentos, subdivisiones y entrenador de velocidad.', m.bpm ? `Último tempo: ${m.bpm} bpm` : ''],
    ['acorde-escalas', 'Sobre un acorde fijo: escalas', 'Suena un acorde; tocá encima sus escalas.', ''],
    ['acorde-arpegios', 'Sobre un acorde fijo: arpegios', 'Suena un acorde; tocá encima sus arpegios.', ''],
    ['ejercicios', 'Ejercicios por objetivo', `${EXERCISES.length} ejercicios de velocidad y calidad de sonido.`, logged.length ? `${logged.length} con récord` : ''],
    ['acordes', 'Formación de acordes', 'CAGED, tríadas por cuerdas, drop 2 y drop 3.', ''],
    ['v-i', 'Relaciones V – I', 'Tensión y resolución con notas guía.', 'Nuevo'],
  ];
  root.innerHTML = `<div class="view-pad">
    ${head('Ejercitación técnica', 'Elegí una herramienta; tu progreso queda guardado acá.')}
    <div class="tc-cards">${cards.map(([id, t, d, s], i) => `<a class="tc-card" href="#/tecnica/${id}"><span class="card-ico">${id === 'v-i' ? VI_ICON : icon(id === 'acordes' ? 'acordes2' : id)}</span><b>${t}</b><p>${d}</p>${s ? `<small>${s}</small>` : ''}</a>`).join('')}</div>
    ${recent.length ? `<h2 class="tc-h2">Últimos récords</h2><div class="tc-rec">${recent.map(([ex, s]) => `<a href="#/tecnica/ejercicios/${ex.id}"><span>${ex.name}</span><b>${s.best} bpm</b></a>`).join('')}</div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------- metrónomo
const SUBS = [[1, 'Negras', '♩'], [2, 'Corcheas', '♫'], [3, 'Tresillos', '3'], [4, 'Semicorcheas', '♬']];
function loadMetroCfg() {
  const s = store.get('tec.metro', {});
  const meter = METERS.find((m) => m.id === s.meter);
  metro.set({
    bpm: s.bpm || 80,
    beats: s.beats || meter?.beats || 4,
    unit: s.unit || meter?.unit || 4,
    sub: s.sub || 1,
    click: true,
    gap: Object.assign({ on: false, play: 2, mute: 2 }, s.gap),
    trainer: Object.assign({ on: false, step: 4, every: 4, max: 140, mode: 'up' }, s.trainer),
  });
  metro.cfg.accents = s.accents && s.accents.length === metro.cfg.beats ? s.accents : defaultAccents(metro.cfg.beats, metro.cfg.unit);
  return s;
}
function saveMetroCfg(extra = {}) {
  const c = metro.cfg;
  const prev = store.get('tec.metro', {});
  store.set('tec.metro', { ...prev, bpm: c.bpm, beats: c.beats, unit: c.unit, meter: meterId(), sub: c.sub, accents: c.accents, gap: c.gap, trainer: c.trainer, ...extra });
}
const meterId = () => METERS.find((m) => m.beats === metro.cfg.beats && m.unit === metro.cfg.unit)?.id || 'custom';

function viewMetro() {
  const saved = loadMetroCfg();
  const tap = tapper();
  let timerMin = saved.timer ?? 0;
  let timerEnd = null;
  const c = metro.cfg;
  root.innerHTML = `<div class="view-pad tc-metro">
    ${back()}
    ${head('Metrónomo', 'Espacio para arrancar y parar. Tocá cada punto para cambiar su acento.')}
    <div class="mt-main">
      <div class="mt-beats" id="mtBeats" aria-label="Pulsos del compás"></div>
      <div class="mt-tempo">
        <button class="ib" data-bpm="-1" aria-label="Más lento">${ICON.minus}</button>
        <div class="mt-big"><b id="mtBpm">${c.bpm}</b><span><span id="mtName">${tempoName(c.bpm)}</span> · bpm</span></div>
        <button class="ib" data-bpm="1" aria-label="Más rápido">${ICON.plus}</button>
      </div>
      <input type="range" min="20" max="300" value="${c.bpm}" id="mtRange" aria-label="Tempo">
      <div class="mt-actions">
        <button class="plain" id="mtTap">Tap</button>
        <button class="tc-play" id="mtPlay" data-space aria-label="Arrancar o parar (espacio)">${ICON.play}${ICON.stop}<span>Arrancar</span></button>
        <div class="mt-status" id="mtStatus">Compás –</div>
      </div>
    </div>
    <div class="mt-grid">
      <section class="tc-box"><h2>Compás</h2>
        <div class="tc-chips" id="mtMeter">${METERS.map((m) => `<button data-meter="${m.id}">${m.id}</button>`).join('')}</div>
        <div class="tc-step"><span>Pulsos por compás</span><button class="ib sm" data-beats="-1" aria-label="Un pulso menos">${ICON.minus}</button><b id="mtBeatsN">${c.beats}</b><button class="ib sm" data-beats="1" aria-label="Un pulso más">${ICON.plus}</button></div>
        <p class="tc-note" id="mtUnit"></p>
      </section>
      <section class="tc-box"><h2>Subdivisión</h2>
        <div class="seg" id="mtSub">${SUBS.map(([v, n, s]) => `<button data-sub="${v}" title="${n}"><span class="sym">${s}</span> ${n}</button>`).join('')}</div>
      </section>
    </div>
    <details class="mt-more" id="mtMore" ${store.get('tec.mtMore', false) ? 'open' : ''}><summary>Entrenamiento: subir tempo, compases en silencio y temporizador</summary>
    <div class="mt-grid">
      <section class="tc-box"><h2><label class="sw"><input type="checkbox" id="trOn"> Entrenador de velocidad</label></h2>
        <div class="tc-form">
          <label>Subir <input type="number" min="1" max="20" id="trStep"> bpm</label>
          <label>cada <input type="number" min="1" max="32" id="trEvery"> compases</label>
          <label>hasta <input type="number" min="21" max="300" id="trMax"> bpm</label>
        </div>
        <div class="seg sm" id="trMode"><button data-mode="up">Subir y mantener</button><button data-mode="mountain">Montaña (sube y baja)</button></div>
      </section>
      <section class="tc-box"><h2><label class="sw"><input type="checkbox" id="gpOn"> Compases en silencio</label></h2>
        <div class="tc-form">
          <label><input type="number" min="1" max="16" id="gpPlay"> con clic</label>
          <label><input type="number" min="1" max="16" id="gpMute"> en silencio</label>
        </div>
        <p class="tc-note">Sirve para comprobar si mantenés el tempo solo: el clic vuelve a entrar y te muestra si te adelantaste.</p>
      </section>
      <section class="tc-box"><h2>Temporizador de práctica</h2>
        <div class="tc-chips" id="tmChips">${[0, 5, 10, 15, 20, 30].map((m) => `<button data-min="${m}">${m ? m + ' min' : 'Sin límite'}</button>`).join('')}</div>
        <p class="tc-note" id="tmLeft"></p>
      </section>
    </div>
    </details>
  </div>`;
  const $ = (id) => root.querySelector('#' + id);

  function drawBeats() {
    $('mtBeats').innerHTML = c.accents.map((a, i) => `<button class="mt-dot ${a === 1 ? 'acc' : a === -1 ? 'mute' : ''}" data-i="${i}" title="Pulso ${i + 1}: ${a === 1 ? 'acento' : a === -1 ? 'silencio' : 'normal'}"><span>${i + 1}</span></button>`).join('');
  }
  function sync() {
    $('mtBpm').textContent = c.bpm;
    $('mtName').textContent = tempoName(c.bpm);
    $('mtRange').value = c.bpm;
    $('mtBeatsN').textContent = c.beats;
    root.querySelectorAll('#mtMeter button').forEach((b) => b.classList.toggle('on', b.dataset.meter === meterId()));
    root.querySelectorAll('#mtSub button').forEach((b) => b.classList.toggle('on', Number(b.dataset.sub) === c.sub));
    $('mtUnit').textContent = c.unit === 8 ? 'En compases de corchea (6/8, 7/8, 12/8) cada pulso del metrónomo es una corchea.' : 'Cada pulso es una negra.';
    $('trOn').checked = c.trainer.on; $('trStep').value = c.trainer.step; $('trEvery').value = c.trainer.every; $('trMax').value = c.trainer.max;
    root.querySelectorAll('#trMode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === c.trainer.mode));
    $('gpOn').checked = c.gap.on; $('gpPlay').value = c.gap.play; $('gpMute').value = c.gap.mute;
    root.querySelectorAll('#tmChips button').forEach((b) => b.classList.toggle('on', Number(b.dataset.min) === timerMin));
    $('mtPlay').classList.toggle('playing', metro.running);
    $('mtPlay').querySelector('span').textContent = metro.running ? 'Parar' : 'Arrancar';
    root.querySelectorAll('.tc-box .tc-form').forEach((f) => f.closest('.tc-box').classList.toggle('off', !f.closest('.tc-box').querySelector('input[type=checkbox]')?.checked));
  }
  const setBpm = (v) => { c.bpm = Math.max(20, Math.min(300, Math.round(v))); saveMetroCfg(); sync(); };

  hooks.onVisual = (b, s, bar, muted) => {
    if (s !== 0) return;
    root.querySelectorAll('.mt-dot').forEach((d, i) => d.classList.toggle('on', i === b));
    $('mtBeats')?.classList.toggle('gap', muted);
    if ($('mtStatus')) $('mtStatus').textContent = `Compás ${bar + 1}${muted ? ' · silencio' : ''}`;
  };
  hooks.onBar = (bar, bpm) => setTimeout(() => { if ($('mtBpm')) { $('mtBpm').textContent = bpm; $('mtName').textContent = tempoName(bpm); $('mtRange').value = bpm; } }, 60);
  hooks.onStop = () => {
    root.querySelectorAll('.mt-dot').forEach((d) => d.classList.remove('on'));
    setTimeout(() => { if ($('mtPlay')) sync(); });
  };

  function tickTimer() {
    if (!timerEnd) { $('tmLeft').textContent = timerMin ? `Arranca al darle play: ${timerMin} min.` : ''; return; }
    const left = Math.max(0, timerEnd - Date.now());
    $('tmLeft').textContent = `Quedan ${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    if (left <= 0) { timerEnd = null; metro.stop(); audio.playChord([72, 76, 79, 84], { dur: 1.2 }); toast('¡Tiempo cumplido!'); sync(); tickTimer(); }
  }
  const iv = setInterval(tickTimer, 500);
  cleanup.push(() => clearInterval(iv));

  root.querySelector('.tc-metro').addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.bpm) setBpm(c.bpm + Number(t.dataset.bpm));
    else if (t.id === 'mtTap') { const v = tap(); if (v) setBpm(v); audio.clickAt(audio.getCtx().currentTime + 0.01, 'beat'); }
    else if (t.id === 'mtPlay') {
      const wasBpm = c.bpm;
      metro.toggle();
      if (metro.running && timerMin) timerEnd = Date.now() + timerMin * 60000;
      if (!metro.running) { timerEnd = null; if (c.trainer.on) { c.bpm = wasBpm; } }
      sync(); tickTimer();
    } else if (t.dataset.meter) {
      const m = METERS.find((x) => x.id === t.dataset.meter);
      metro.set({ unit: m.unit, beats: m.beats });
      saveMetroCfg(); drawBeats(); sync();
    } else if (t.dataset.beats) {
      const n = Math.max(1, Math.min(16, c.beats + Number(t.dataset.beats)));
      metro.set({ beats: n });
      saveMetroCfg(); drawBeats(); sync();
    } else if (t.dataset.sub) { metro.set({ sub: Number(t.dataset.sub) }); saveMetroCfg(); sync(); }
    else if (t.dataset.mode) { c.trainer.mode = t.dataset.mode; saveMetroCfg(); sync(); }
    else if (t.dataset.min != null && t.closest('#tmChips')) { timerMin = Number(t.dataset.min); saveMetroCfg({ timer: timerMin }); timerEnd = metro.running && timerMin ? Date.now() + timerMin * 60000 : null; sync(); tickTimer(); }
    else if (t.classList.contains('mt-dot')) {
      const i = Number(t.dataset.i);
      c.accents[i] = c.accents[i] === 0 ? 1 : c.accents[i] === 1 ? -1 : 0;
      saveMetroCfg(); drawBeats();
    }
  });
  $('mtRange').addEventListener('input', (e) => setBpm(Number(e.target.value)));
  root.querySelector('.mt-grid').addEventListener('change', (e) => {
    const t = e.target;
    const num = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number(v) || d));
    if (t.id === 'trOn') c.trainer.on = t.checked;
    if (t.id === 'trStep') c.trainer.step = num(t.value, 1, 20, 4);
    if (t.id === 'trEvery') c.trainer.every = num(t.value, 1, 32, 4);
    if (t.id === 'trMax') c.trainer.max = num(t.value, 21, 300, 140);
    if (t.id === 'gpOn') c.gap.on = t.checked;
    if (t.id === 'gpPlay') c.gap.play = num(t.value, 1, 16, 2);
    if (t.id === 'gpMute') c.gap.mute = num(t.value, 1, 16, 2);
    saveMetroCfg(); sync();
  });
  drawBeats(); sync(); tickTimer();
}

// ---------------------------------------------------------------- hoja de escala / arpegio (estética del libro)
function sheetOpts(kind, rootPc, id) {
  const d = build(kind, rootPc, id);
  const meta = d.meta;
  const names = Array.from({ length: 12 }, (_, p) => nn(d.spelled.get(p) || PREF[p]));
  const rn = nn(d.root);
  const tonicColor = prefs.tonic === 'color' ? meta.color || '#1E1E1E' : '#1E1E1E';
  const title = kind === 'escala'
    ? [meta.fam === 'mayor' ? 'Modo' : 'Escala', scaleTitle(rn, meta)]
    : ['Arpegio', rn + meta.sym];
  return {
    d, opts: {
      positions: d.positions, tonicPc: rootPc, tonicColor, labelMode: prefs.labels, names, label: d.label,
      showNeck: prefs.neck === 'on', title, legend: [{ color: tonicColor, text: `Tónica ${rn}` }],
    },
  };
}
// pos: 'all' | número | 'neck'
function sheetHtml(o, pos) {
  const tmp = document.createElement('div');
  tmp.innerHTML = sheetSvg(o);
  const svg = tmp.querySelector('svg');
  if (pos !== 'all') {
    svg.querySelectorAll(pos === 'neck' ? '.pos' : `.pos:not([data-i="${pos}"]), .neck`).forEach((g) => g.remove());
    const [x, y, w, h] = boxOf(pos);
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
    svg.classList.add(pos === 'neck' ? 'crop-neck' : 'crop');
  } else if (!o.showNeck) {
    // sin mástil: recorta el alto a las posiciones
    const [x, y, w, h] = boxOf(o.positions.length - 1);
    svg.setAttribute('viewBox', `0 0 1240 ${y + h + 20}`);
  } else if (o.positions.length < 7) {
    svg.setAttribute('viewBox', `0 0 1240 ${boxOf('neck')[1] + boxOf('neck')[3] + 10}`);
  }
  svg.querySelectorAll('.hit').forEach((r) => r.remove());
  return tmp.innerHTML;
}
function bindSheetClicks(container) {
  container.addEventListener('click', (e) => {
    const n = e.target.closest('.n'); if (!n) return;
    const [s, f] = n.dataset.k.split(':').map(Number);
    audio.pluck(midiOf(s, f));
    n.classList.add('on');
    setTimeout(() => n.classList.remove('on'), 300);
  });
}

// ---------------------------------------------------------------- sobre un acorde fijo
const FIXED = [['mayor', 'Mayor'], ['menor', 'Menor'], ['dim', 'Disminuido'], ['maj7', 'maj7'], ['7', '7'], ['m7', 'm7'], ['m7b5', 'm7(b5)']];
const pcsOf = (rootPc, intervals) => new Set(intervals.map((iv) => mod(rootPc + ivSemis(iv))));
const isSub = (a, b) => [...a].every((x) => b.has(x));

function compatibleScales(chordId, rootPc) {
  const ch = pcsOf(rootPc, chordById(chordId).intervals);
  const order = IMPRO[chordId]?.scales || [];
  const ok = SCALES.filter((s) => isSub(ch, pcsOf(rootPc, s.intervals)));
  const rank = (s) => (order.includes(s.id) ? order.indexOf(s.id) : 100 + SCALES.indexOf(s));
  return ok.sort((a, b) => rank(a) - rank(b));
}
const extras = (chordId) => EXTRA_SCALES.filter((s) => (IMPRO[chordId]?.scales || []).includes(s.id));

function arpeggioOptions(chordId, rootPc, rootNote) {
  const chord = chordById(chordId);
  const ch = pcsOf(rootPc, chord.intervals);
  const scales = compatibleScales(chordId, rootPc).filter((s) => s.intervals.length === 7);
  const main = scales[0];
  const inAny = (c) => scales.slice(0, 3).some((s) => isSub(pcsOf(rootPc, c.intervals), pcsOf(rootPc, s.intervals)));
  const own = [{ kind: 'own', id: chordId, pc: rootPc, name: nn(rootNote) + chord.sym, adds: chord.intervals.join(' '), note: 'Notas del acorde' }];
  const ext = CHORDS.filter((c) => c.id !== chordId && c.intervals.length > chord.intervals.length && isSub(ch, pcsOf(rootPc, c.intervals)) && inAny(c))
    .map((c) => ({ kind: 'ext', id: c.id, pc: rootPc, name: nn(rootNote) + c.sym, adds: c.intervals.filter((iv) => !chord.intervals.includes(iv) && !(iv === '5' && chord.intervals.includes('#5'))).map(toExt), note: 'agrega' })).map((x) => ({ ...x, adds: extOrder(x.adds).join(' ') }));
  const sup = main ? superimpositions(rootPc, main.intervals).filter((s) => [2, 4, 6].includes(s.deg) && s.chord).map((s) => {
    const r = transpose(rootNote, main.intervals[s.deg]);
    const deg = { 2: '3ra', 4: '5ta', 6: '7ma' }[s.deg];
    return { kind: 'sup', id: s.chord.id, pc: mod(rootPc + ivSemis(main.intervals[s.deg])), name: nn(r) + s.chord.sym, adds: s.tones.join(' '), note: `desde la ${deg} (${main.name})` };
  }) : [];
  return { own, ext, sup, main };
}

function chordMidis(chordId, rootPc) {
  const bass = 40 + mod(rootPc - 4);
  const ivs = chordById(chordId).intervals;
  return [bass, ...ivs.map((iv) => bass + 12 + ivSemis(iv))];
}

function viewChord(mode) {
  const st = Object.assign({ root: 0, chord: 'mayor', sel: null, pos: 0, back: 'strum', click: true }, store.get('tec.fixed', {}));
  const save = () => store.set('tec.fixed', st);
  if (!FIXED.some(([id]) => id === st.chord)) st.chord = 'mayor';
  const chord = chordById(st.chord);
  const rootNote = bestRoot(st.root, chord.intervals);
  const sym = nn(rootNote) + chord.sym;
  const imp = IMPRO[st.chord] || {};
  let list = [];
  if (mode === 'escalas') {
    const sc = compatibleScales(st.chord, st.root);
    const chordSet = new Set(chord.intervals.map(ivSemis));
    list = sc.map((s, i) => ({ id: s.id, kind: 'escala', pc: st.root, name: scaleTitle(nn(rootNote), s), fam: s.fam,
      adds: extOrder(s.intervals.filter((iv) => !chordSet.has(ivSemis(iv))).map(toExt)).join(' '), note: s.char, first: i === 0 }));
  } else {
    const o = arpeggioOptions(st.chord, st.root, rootNote);
    list = [...o.own.map((x) => ({ ...x, grp: 'El acorde' })), ...o.ext.map((x) => ({ ...x, grp: 'Con extensiones (misma fundamental)' })), ...o.sup.map((x) => ({ ...x, grp: 'Arpegios superpuestos' }))]
      .map((x) => ({ ...x, kind: 'arpegio' }));
  }
  const key = (x) => `${x.kind}:${x.id}:${x.pc}`;
  let sel = list.find((x) => key(x) === st.sel) || list[0];

  const famName = (f) => FAMILIES.find((x) => x.id === f)?.name || '';
  let grp = null;
  const items = list.map((x) => {
    const g = mode === 'escalas' ? famName(x.fam) : x.grp;
    const hdr = g !== grp ? `<div class="fx-grp">${g}</div>` : '';
    grp = g;
    const addsLbl = mode === 'escalas' ? (x.adds ? `tensiones ${x.adds}` : 'solo notas del acorde') : (x.kind === 'own' ? x.adds : `${x.note}: ${x.adds}`);
    return `${hdr}<button class="fx-item${key(x) === key(sel) ? ' on' : ''}" aria-pressed="${key(x) === key(sel)}" data-key="${key(x)}"><b>${x.name}${x.first ? ' <em>principal</em>' : ''}</b><small>${mode === 'escalas' ? `Nota característica: ${esc(x.note)}` : addsLbl}</small></button>`;
  }).join('');
  const ex = mode === 'escalas' ? extras(st.chord) : [];

  root.innerHTML = `<div class="view-pad tc-fixed">
    ${back()}
    ${head('Sobre un acorde fijo', mode === 'escalas' ? 'Sonás el acorde y probás encima cada escala: escuchá qué color aporta.' : 'Sonás el acorde y tocás su arpegio, sus extensiones y arpegios superpuestos.',
    `<div class="seg tc-mode"><button data-go="acorde-escalas" class="${mode === 'escalas' ? 'on' : ''}">Escalas y modos</button><button data-go="acorde-arpegios" class="${mode === 'arpegios' ? 'on' : ''}">Arpegios</button></div>`)}
    <section class="tc-box fx-pick">
      <div class="fx-row"><span>Tónica</span><div class="tc-chips roots12">${Array.from({ length: 12 }, (_, p) => `<button data-root="${p}" class="${p === st.root ? 'on' : ''}">${rootChip(p)}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Acorde</span><div class="tc-chips">${FIXED.map(([id, n], i) => `${i === 3 ? '<i class="sep"></i>' : ''}<button data-chord="${id}" class="${id === st.chord ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    </section>
    <section class="fx-backing">
      <button class="tc-play" id="fxPlay" data-space aria-label="Sonar el acorde (espacio)">${ICON.play}${ICON.stop}<span>Sonar</span></button>
      <div class="fx-sym"><b>${sym}</b><small>${chord.intervals.join(' · ')} · ${chord.intervals.map((iv) => nn(transpose(rootNote, iv))).join(' ')}</small></div>
      <div class="bpm"><button class="ib sm" data-fbpm="-5" aria-label="Más lento">${ICON.minus}</button><span><b id="fxBpm">${metro.cfg.bpm}</b> bpm</span><button class="ib sm" data-fbpm="5" aria-label="Más rápido">${ICON.plus}</button></div>
      <div class="mini-seg" id="fxBack"><button data-back="strum" class="${st.back === 'strum' ? 'on' : ''}">Rasgueo</button><button data-back="drone" class="${st.back === 'drone' ? 'on' : ''}">Bordón</button></div>
      <label class="sw"><input type="checkbox" id="fxClick" ${st.click ? 'checked' : ''}> Clic</label>
    </section>
    <p class="tc-guide">${mode === 'escalas'
      ? `Apoyá las notas del acorde (<b>${chord.intervals.join(' ')}</b>) en los tiempos fuertes; las demás son tensiones (color)${imp.avoid?.length ? `. Notas a evitar o de paso: ${imp.avoid.join(', ')}` : ''}.`
      : `Empezá por el arpegio del acorde en sus posiciones (tónica con el dedo 1). Cuando salga limpio, sumá las notas <b>9, 11, 13</b> de la escala como tensiones sobre el acorde.`}</p>
    <div class="fx-body">
      <div class="fx-list" role="group" aria-label="Opciones">${items}${ex.length ? `<p class="tc-note">También: ${ex.map((s) => s.name).join(', ')} (simétricas, sin las 7 figuras).</p>` : ''}</div>
      <div class="fx-sheet"><div class="fx-pos" id="fxPos"></div><div class="fx-paper" id="fxPaper"></div></div>
    </div>
  </div>`;
  const $ = (id) => root.querySelector('#' + id);

  function drawSheet() {
    if (!sel) { $('fxPaper').innerHTML = '<p class="tc-note">No hay opciones.</p>'; return; }
    const { opts } = sheetOpts(sel.kind, sel.pc, sel.id);
    const n = opts.positions.length;
    if (st.pos !== 'all' && st.pos !== 'neck' && st.pos >= n) st.pos = 0;
    if (st.pos === 'neck' && !opts.showNeck) st.pos = 0;
    $('fxPos').innerHTML = `<span>${sel.name}</span><div class="tc-chips sm">${opts.positions.map((p, i) => `<button data-pos="${i}" class="${st.pos === i ? 'on' : ''}" title="Posición ${i + 1}">${i + 1}</button>`).join('')}${opts.showNeck ? `<button data-pos="neck" class="${st.pos === 'neck' ? 'on' : ''}">Mástil</button>` : ''}<button data-pos="all" class="${st.pos === 'all' ? 'on' : ''}">Todas</button></div>`;
    $('fxPaper').innerHTML = sheetHtml(opts, st.pos);
    $('fxPaper').classList.toggle('neck', st.pos === 'neck');
    const svg = $('fxPaper').querySelector('svg');
    document.fonts.ready.then(() => layoutLegend(svg));
  }
  bindSheetClicks($('fxPaper'));

  // acompañamiento
  const midis = chordMidis(st.chord, st.root);
  function startBacking() {
    metro.set({ click: st.click, sub: 1, gap: { on: false, play: 2, mute: 2 }, trainer: { on: false, step: 4, every: 4, max: 300, mode: 'up' } });
    if (st.back === 'drone') {
      stopDrone = audio.drone([midis[0], ...midis.slice(1, 4)].slice(0, 4));
      hooks.onBeat = null;
    } else {
      hooks.onBeat = (beat, sub, bar, when, barDur) => { if (beat === 0 && sub === 0) audio.chordAt(midis, when, barDur * 0.92, 0.028, 0.5); };
    }
    metro.start();
  }
  function stopBacking() { metro.stop(); stopDrone?.(); stopDrone = null; }
  const running = () => metro.running;
  function syncPlay() {
    $('fxPlay').classList.toggle('playing', running());
    $('fxPlay').querySelector('span').textContent = running() ? 'Parar' : 'Sonar';
  }
  hooks.onStop = () => setTimeout(() => $('fxPlay') && syncPlay());

  root.querySelector('.tc-fixed').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.go) { location.hash = '#/tecnica/' + b.dataset.go; return; }
    if (b.dataset.root != null) { stopBacking(); st.root = Number(b.dataset.root); st.sel = null; save(); redraw(); return; }
    if (b.dataset.chord) { stopBacking(); st.chord = b.dataset.chord; st.sel = null; save(); redraw(); return; }
    if (b.dataset.key) {
      st.sel = b.dataset.key; save();
      sel = list.find((x) => key(x) === st.sel);
      root.querySelectorAll('.fx-item').forEach((x) => x.setAttribute('aria-pressed', x === b) || x.classList.toggle('on', x === b));
      drawSheet();
      if (window.innerWidth < 900) $('fxPos').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (b.dataset.pos != null) { st.pos = b.dataset.pos === 'all' || b.dataset.pos === 'neck' ? b.dataset.pos : Number(b.dataset.pos); save(); drawSheet(); return; }
    if (b.id === 'fxPlay') { running() ? stopBacking() : startBacking(); syncPlay(); return; }
    if (b.dataset.fbpm) {
      metro.cfg.bpm = Math.max(30, Math.min(240, metro.cfg.bpm + Number(b.dataset.fbpm)));
      saveMetroCfg(); $('fxBpm').textContent = metro.cfg.bpm; return;
    }
    if (b.dataset.back) {
      const was = running(); stopBacking(); st.back = b.dataset.back; save();
      root.querySelectorAll('#fxBack button').forEach((x) => x.classList.toggle('on', x === b));
      if (was) startBacking(); syncPlay(); return;
    }
  });
  $('fxClick').addEventListener('change', (e) => { st.click = e.target.checked; save(); metro.set({ click: st.click }); });
  loadMetroCfgBpmOnly();
  $('fxBpm').textContent = metro.cfg.bpm;
  drawSheet();
}
function loadMetroCfgBpmOnly() { const s = store.get('tec.metro', {}); if (s.bpm) metro.cfg.bpm = s.bpm; metro.set({ beats: 4, unit: 4 }); }

// ---------------------------------------------------------------- ejercicios
function viewExercises() {
  const f = Object.assign({ mano: 'todas', obj: 'todos' }, store.get('tec.exFilter', {}));
  const list = EXERCISES.filter((ex) => (f.mano === 'todas' || ex.mano === f.mano) && (f.obj === 'todos' || ex.obj.includes(f.obj)));
  root.innerHTML = `<div class="view-pad tc-exs">
    ${back()}
    ${head('Ejercicios por objetivo', 'Empezá al 60% del tempo objetivo y subí 4 bpm cada 3 pasadas limpias.')}
    <div class="ex-filters">
      <div class="seg" id="fMano">${MANOS.map(([id, n]) => `<button data-mano="${id}" class="${f.mano === id ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="tc-chips" id="fObj">${OBJETIVOS.map(([id, n]) => `<button data-obj="${id}" class="${f.obj === id ? 'on' : ''}">${n}</button>`).join('')}</div>
    </div>
    <div class="ex-list">${list.map((ex) => {
      const s = store.get('tec.ex.' + ex.id, null);
      const pct = s?.best ? Math.min(100, Math.round((s.best / ex.target) * 100)) : 0;
      return `<a class="ex-card" href="#/tecnica/ejercicios/${ex.id}">
        <div class="ex-top"><b>${ex.name}</b><span class="ex-mano">${MANO_NAME[ex.mano]}</span></div>
        <p>${ex.desc}</p>
        <div class="ex-tags">${ex.obj.map((o) => `<span class="chip">${OBJ_NAME[o]}</span>`).join('')}<span class="ex-goal">${s?.best ? `récord ${s.best} / ${ex.target} bpm` : `objetivo ${ex.target} bpm`}</span></div>
        <div class="ex-bar"><i style="transform:scaleX(${pct / 100})"></i></div>
      </a>`;
    }).join('') || '<p class="tc-note">No hay ejercicios con ese filtro.</p>'}</div>
  </div>`;
  root.querySelector('.ex-filters').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mano) f.mano = b.dataset.mano;
    if (b.dataset.obj) f.obj = b.dataset.obj;
    store.set('tec.exFilter', f);
    redraw();
  });
}

function sparkline(log, target) {
  if (!log || log.length < 2) return '';
  const w = 220, h = 48;
  const vals = log.map((x) => x.bpm);
  const lo = Math.min(...vals, target * 0.5), hi = Math.max(...vals, target);
  const x = (i) => 4 + (i / (log.length - 1)) * (w - 8);
  const y = (v) => h - 4 - ((v - lo) / Math.max(1, hi - lo)) * (h - 8);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="Progreso">
    <line x1="0" x2="${w}" y1="${y(target)}" y2="${y(target)}" class="sp-t"/>
    <polyline points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" class="sp-l"/>
    ${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.5" class="sp-d"/>`).join('')}</svg>`;
}

function viewExercise(id) {
  const ex = EXERCISES.find((x) => x.id === id);
  if (!ex) { location.hash = '#/tecnica/ejercicios'; return; }
  const k = 'tec.ex.' + ex.id;
  const s = Object.assign({ bpm: Math.round((ex.target * 0.6) / 2) * 2, reps: 0, best: 0, log: [], variant: ex.variants?.[0].id, subClick: false }, store.get(k, {}));
  const save = () => store.set(k, s);
  const variant = ex.variants?.find((v) => v.id === s.variant) || ex.variants?.[0];
  const src = variant ? variant.tab : ex.tab;
  const ev = parseTab(src);
  const reps = ex.reps || 3;
  root.innerHTML = `<div class="view-pad tc-ex">
    ${back('Ejercicios', '#/tecnica/ejercicios')}
    ${head(ex.name, `${MANO_NAME[ex.mano]} · ${ex.obj.map((o) => OBJ_NAME[o]).join(', ')}`)}
    <p class="ex-desc">${ex.desc}</p>
    ${ex.variants ? `<div class="ex-var"><span>Permutación</span><div class="tc-chips">${ex.variants.map((v) => `<button data-var="${v.id}" class="${v.id === variant.id ? 'on' : ''}">${v.label}</button>`).join('')}</div></div>` : ''}
    <div class="ex-tab" id="exTab">${tabSvg(ev, { title: ex.name })}</div>
    <p class="tc-note">⊓ púa hacia abajo · V hacia arriba · h ligado ascendente · p ligado descendente (o pulgar en fingerstyle) · / \\ deslizar · × nota muerta</p>
    <section class="ex-practice">
      <div class="ex-tempo">
        <button class="ib" data-eb="-2" aria-label="Más lento">${ICON.minus}</button>
        <div class="mt-big"><b id="exBpm">${s.bpm}</b><span>bpm · objetivo ${ex.target}</span></div>
        <button class="ib" data-eb="2" aria-label="Más rápido">${ICON.plus}</button>
      </div>
      <div class="ex-bar big"><i id="exProg" style="transform:scaleX(${Math.min(1, s.bpm / ex.target)})"></i></div>
      <div class="ex-btns">
        <button class="tc-play" id="exPlay" data-space>${ICON.play}${ICON.stop}<span>Metrónomo</span></button>
        <button class="plain" id="exListen">${ICON.sound}<span>Escuchar</span></button>
        <label class="sw"><input type="checkbox" id="exSub" ${s.subClick ? 'checked' : ''}> Marcar subdivisión</label>
      </div>
      <div class="ex-ladder">
        <button class="ok-btn" id="exClean">${ICON.check}<span>Salió limpio</span></button>
        <div class="ex-reps" id="exReps"></div>
        <button class="plain" id="exDown">Bajar 4 bpm</button>
      </div>
      <div class="ex-rec" id="exRec"></div>
    </section>
    <div class="ex-cols">
      <section><h2>Cómo practicarlo</h2><ol>${ex.steps.map((x) => `<li>${x}</li>`).join('')}</ol></section>
      <section><h2>Criterios de calidad</h2><p class="tc-note">Antes de marcar "limpio", revisá:</p>${ex.criteria.map((x, i) => `<label class="ex-crit"><input type="checkbox" data-crit="${i}"> ${x}</label>`).join('')}</section>
    </div>
  </div>`;
  const $ = (q) => root.querySelector('#' + q);
  function sync() {
    $('exBpm').textContent = s.bpm;
    $('exProg').style.transform = `scaleX(${Math.min(1, s.bpm / ex.target)})`;
    $('exReps').innerHTML = Array.from({ length: reps }, (_, i) => `<i class="${i < s.reps ? 'on' : ''}"></i>`).join('') + `<span>${s.reps}/${reps} limpias a ${s.bpm}</span>`;
    $('exRec').innerHTML = s.best ? `<div><small>Récord limpio</small><b>${s.best} bpm</b>${s.last ? `<small>${s.last.split('-').reverse().join('/')}</small>` : ''}</div>${sparkline(s.log, ex.target)}` : '<small>Todavía sin registro: marcá "Salió limpio" cuando lo toques sin errores.</small>';
    $('exPlay').classList.toggle('playing', metro.running);
  }
  const setBpm = (v) => { s.bpm = Math.max(30, Math.min(300, v)); s.reps = 0; save(); metro.set({ bpm: s.bpm }); sync(); };
  function startMetro() {
    metro.set({ bpm: s.bpm, beats: 4, unit: 4, sub: s.subClick ? ex.sub : 1, click: true, gap: { on: false, play: 2, mute: 2 }, trainer: { on: false, step: 4, every: 4, max: 300, mode: 'up' } });
    metro.start();
  }
  hooks.onStop = () => setTimeout(() => $('exPlay') && sync());
  let listenTimer = null;
  function highlight(i) {
    root.querySelectorAll('#exTab .tb-n.on').forEach((t) => t.classList.remove('on'));
    if (i != null) root.querySelectorAll(`#exTab .tb-n[data-i="${i}"]`).forEach((t) => t.classList.add('on'));
  }
  cleanup.push(() => { clearTimeout(listenTimer); highlight(null); });
  function listen() {
    audio.stop();
    const notes = tabNotes(ev, ex.sub);
    const ctx = audio.getCtx();
    const beat = 60 / s.bpm;
    let t = ctx.currentTime + 0.08;
    const timers = [];
    notes.forEach((n) => {
      if (n.midis.length) audio.chordAt(n.midis, t, n.dur * beat * 1.4, 0.012, n.midis.length > 1 ? 0.5 : 0.85);
      const at = (t - ctx.currentTime) * 1000;
      timers.push(setTimeout(() => highlight(n.i), at));
      t += n.dur * beat;
    });
    timers.push(setTimeout(() => highlight(null), (t - ctx.currentTime) * 1000 + 200));
    cleanup.push(() => timers.forEach(clearTimeout));
  }
  root.querySelector('.tc-ex').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.var) { s.variant = b.dataset.var; save(); stopAll(); redraw(); return; }
    if (b.dataset.eb) setBpm(s.bpm + Number(b.dataset.eb));
    else if (b.id === 'exPlay') { metro.running ? metro.stop() : startMetro(); sync(); }
    else if (b.id === 'exListen') listen();
    else if (b.id === 'exClean') {
      s.reps++;
      if (s.bpm > s.best) s.best = s.bpm;
      s.last = today();
      const lg = s.log.find((x) => x.d === today());
      if (lg) lg.bpm = Math.max(lg.bpm, s.bpm); else s.log.push({ d: today(), bpm: s.bpm });
      if (s.log.length > 60) s.log = s.log.slice(-60);
      if (s.reps >= reps) {
        s.reps = 0;
        s.bpm = Math.min(300, s.bpm + 4);
        metro.set({ bpm: s.bpm });
        toast(s.bpm > ex.target ? `¡Objetivo superado! Ahora ${s.bpm} bpm` : `Bien. Subís a ${s.bpm} bpm`);
      }
      root.querySelectorAll('[data-crit]').forEach((c) => (c.checked = false));
      save(); sync();
    } else if (b.id === 'exDown') { setBpm(s.bpm - 4); toast(`Bajás a ${s.bpm} bpm: priorizá que salga limpio`); }
  });
  $('exSub').addEventListener('change', (e) => { s.subClick = e.target.checked; save(); if (metro.running) metro.set({ sub: s.subClick ? ex.sub : 1 }); });
  sync();
}

// ---------------------------------------------------------------- formación de acordes
const VOICE_MODES = [['caged', 'CAGED'], ['triadas', 'Tríadas'], ['drop2', 'Drop 2'], ['drop3', 'Drop 3']];
const setName = (set) => set.slice().sort((a, b) => a - b).join('-');
function viewVoicings() {
  const st = Object.assign({ mode: 'caged', root: 0, caged: 'mayor', triad: 'mayor', seventh: 'maj7', set: 0, labels: 'interval' }, store.get('tec.voc', {}));
  const save = () => store.set('tec.voc', st);
  let type, sets, voicings = [];
  if (st.mode === 'caged') type = st.caged;
  else if (st.mode === 'triadas') { type = st.triad; sets = TRIAD_SETS; }
  else { type = st.seventh; sets = st.mode === 'drop2' ? DROP2_SETS : DROP3_SETS; }
  if (sets && st.set >= sets.length) st.set = 0;
  const chord = chordById(type);
  const rootNote = bestRoot(st.root, chord.intervals);
  const sym = nn(rootNote) + chord.sym;
  if (st.mode === 'caged') voicings = cagedShapes(type, st.root).map((v) => ({ ...v, cap: `Forma ${v.form}`, sub: v.base ? `traste ${v.base}` : 'al aire' }));
  else if (st.mode === 'triadas') voicings = triadVoicings(type, st.root, sets[st.set]).map((v) => ({ ...v, cap: v.name, sub: `bajo: ${v.notes[0].iv}` }));
  else voicings = dropVoicings(type, st.root, sets[st.set], st.mode === 'drop2' ? 2 : 3).map((v) => ({ ...v, cap: v.name, sub: `bajo: ${v.notes[0].iv}` }));
  const typeList = st.mode === 'caged' ? CAGED_TYPES : st.mode === 'triadas' ? TRIAD_TYPES : SEVENTH_TYPES;
  const typeKey = st.mode === 'caged' ? 'caged' : st.mode === 'triadas' ? 'triad' : 'seventh';
  const labelOf = (n, open) => {
    if (st.labels === 'note') return nn(transpose(rootNote, n.iv));
    if (st.labels === 'finger' && n.finger != null && !open) return n.finger || '';
    return n.iv === '1' ? 'R' : n.iv;
  };
  const info = {
    caged: 'Las 5 formas abiertas (Do, La, Sol, Mi, Re) movidas con cejilla. Se encadenan en ese orden a lo largo del mástil; cada una contiene una posición de la escala.',
    triadas: 'Tríadas cerradas en cuerdas vecinas: fundamental y dos inversiones en cada grupo de 3 cuerdas.',
    drop2: 'Del acorde cerrado se baja una octava la 2da voz desde arriba. 4 inversiones en cuerdas vecinas.',
    drop3: 'Del acorde cerrado se baja una octava la 3ra voz desde arriba. Queda una cuerda apagada entre el bajo y el resto.',
  }[st.mode];
  root.innerHTML = `<div class="view-pad tc-voc">
    ${back()}
    ${head('Formación de acordes', info)}
    <div class="seg vc-mode">${VOICE_MODES.map(([id, n]) => `<button data-mode="${id}" class="${st.mode === id ? 'on' : ''}">${n}</button>`).join('')}</div>
    <section class="tc-box fx-pick">
      <div class="fx-row"><span>Tónica</span><div class="tc-chips roots12">${Array.from({ length: 12 }, (_, p) => `<button data-root="${p}" class="${p === st.root ? 'on' : ''}">${rootChip(p)}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Tipo</span><div class="tc-chips">${typeList.map(([id, n]) => `<button data-type="${id}" class="${id === type ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Etiquetas</span><div class="seg sm vc-lbl">${[['interval', 'Intervalos'], ['note', 'Notas'], ...(st.mode === 'caged' ? [['finger', 'Dedos']] : [])].map(([id, n]) => `<button data-lbl="${id}" class="${(st.labels === id || (id === 'interval' && st.labels === 'finger' && st.mode !== 'caged')) ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      ${sets ? `<div class="fx-row"><span>Cuerdas</span><div class="tc-chips">${sets.map((s, i) => `<button data-set="${i}" class="${i === st.set ? 'on' : ''}">${setName(s)}</button>`).join('')}</div></div>` : ''}
    </section>
    <div class="vc-head"><b>${sym}</b><small>${chord.intervals.join(' ')} = ${chord.intervals.map((iv) => nn(transpose(rootNote, iv))).join(' ')}</small>
      <button class="plain" id="vcCycle">${ICON.sound}<span>Tocar todas</span></button></div>
    <div class="vc-grid">${voicings.map((v, i) => `<button class="vc-item" data-v="${i}" aria-label="${v.cap}, ${v.sub}. Tocar">${chordBox(v, { labels: labelOf, title: sym, sub: v.cap })}<b>${v.cap}</b><small>${v.sub}</small></button>`).join('')}</div>
    <p class="tc-note">Tocá un diagrama para escucharlo. R = fundamental (en negro). ${st.mode === 'caged' ? 'Los dedos corresponden a la forma con cejilla; al aire, a la digitación abierta.' : 'La digitación de las inversiones depende del contexto: se muestran intervalos o notas.'}</p>
  </div>`;
  root.querySelector('.tc-voc').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mode) { st.mode = b.dataset.mode; st.set = 0; }
    else if (b.dataset.root != null) st.root = Number(b.dataset.root);
    else if (b.dataset.type) st[typeKey] = b.dataset.type;
    else if (b.dataset.set != null) st.set = Number(b.dataset.set);
    else if (b.dataset.lbl) st.labels = b.dataset.lbl;
    else if (b.dataset.v != null) { audio.playChord(voicings[Number(b.dataset.v)].notes.map(midiOfNote), { dur: 1.8, strum: 0.035 }); return; }
    else if (b.id === 'vcCycle') { audio.playSeq(voicings.map((v) => v.notes.map(midiOfNote)), { step: 1.1, dur: 0.9 }); return; }
    else return;
    save(); redraw();
  });
}
document.addEventListener('toggle', (e) => { if (e.target.id === 'mtMore') store.set('tec.mtMore', e.target.open); }, true);

// ---------------------------------------------------------------- relaciones V–I, I–V–I, II–V–I
const VI_SETS = { triadas: TRIAD_SETS.slice(0, 3), '7': DROP2_SETS };
const PICK_KEYS = [0, 7, 2, 9, 4, 11, 6, 5, 10, 3, 8, 1]; // orden por quintas
// Voicings de cada acorde en el grupo de cuerdas, eligiendo la inversión más cercana al anterior (conducción de voces)
function leadVoicings(chords, level, set, zone) {
  const cands = (c) => {
    const base = level === 'triadas' ? triadVoicings(c.chord.id, notePc(c.root), set) : dropVoicings(c.chord.id, notePc(c.root), set, 2);
    const up = base.filter((v) => Math.max(...v.notes.map((n) => n.f)) + 12 <= 17).map((v) => ({ ...v, notes: v.notes.map((n) => ({ ...n, f: n.f + 12 })) }));
    return [...base, ...up];
  };
  const avg = (v) => v.notes.reduce((t, n) => t + n.f, 0) / v.notes.length;
  const dist = (a, b) => a.notes.reduce((t, n, i) => t + Math.abs(midiOfNote(n) - midiOfNote(b.notes[i])), 0);
  const out = [];
  const cache = new Map();
  chords.forEach((c, i) => {
    if (cache.has(c.deg) && i > 0) { out.push(cache.get(c.deg)); return; }
    const list = cands(c);
    const prev = out[i - 1];
    const best = list.sort((a, b) => (prev ? dist(a, prev) - dist(b, prev) : Math.abs(avg(a) - zone) - Math.abs(avg(b) - zone)))[0];
    cache.set(c.deg, best);
    out.push(best);
  });
  return out;
}
const VI_ICON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17V7l5 5-5 5zM12 7h2.5a3 3 0 0 1 0 6H12zM12 13h3l4 4"/><path d="M14 17h6" opacity=".5"/></svg>';


// ---------- V–I: gráficos ----------
const FIFTHS_KEYS = [[0, 0], [4, 0], [1, 0], [5, 0], [2, 0], [6, 0], [3, 1], [1, -1], [5, -1], [2, -1], [6, -1], [3, 0]].map(([l, a]) => mkNote(l, a));
const posOf = (pc) => (pc * 7) % 12;
function viCircle(P, mode) {
  const names = FIFTHS_KEYS.map(nn);
  const minors = FIFTHS_KEYS.map((k) => nn(transpose(k, '6')) + 'm');
  const t = notePc(P.tonic);
  const I = mode === 'mayor' ? { pos: posOf(t), ring: 'out' } : { pos: posOf((t + 3) % 12), ring: 'in' };
  const V = { pos: posOf(notePc(P.byDeg.V.root)), ring: 'out' };
  const marks = [{ ...I, color: FN_COLOR.Tónica }, { ...V, color: FN_COLOR.Dominante }];
  const arrows = [[V.pos, I.pos, FN_COLOR.Dominante]];
  if (P.byDeg.II) {
    const ii = notePc(P.byDeg.II.root);
    const II = mode === 'mayor' ? { pos: posOf((ii + 3) % 12), ring: 'in' } : { pos: posOf(ii), ring: 'out' };
    marks.push({ ...II, color: FN_COLOR.Subdominante });
    arrows.unshift([posOf(ii), V.pos, FN_COLOR.Subdominante]);
  }
  return fifths(names, minors, { marks, arrows, label: `Círculo de quintas: ${P.chords.map((c) => nn(c.root) + c.chord.sym).join(', ')}`, size: 240 });
}
// teclado de un acorde con colores por función (3ra y 7ma = notas guía)
function viKeys(c) {
  const r = notePc(c.root);
  return keyboard(c.chord.intervals.map((iv, i) => ({ i: r + ivSemis(iv), label: nn(c.notes[i]), sub: iv, color: ROLE[roleOf(iv)] })), { label: `Notas de ${nn(c.root)}${c.chord.sym}` });
}
function viewVI() {
  const st = Object.assign({ root: 0, mode: 'mayor', prog: 'v-i', level: '7', bars: 1, set: 0, zone: 7, labels: 'interval', click: true }, store.get('tec.vi', {}));
  const save = () => store.set('tec.vi', st);
  const sets = VI_SETS[st.level];
  if (st.set >= sets.length) st.set = 0;
  const P = progression(st.root, st.mode, st.level, st.prog);
  const voic = leadVoicings(P.chords, st.level, sets[st.set], st.zone);
  const I = P.byDeg.I; const V = P.byDeg.V; const II = P.byDeg.II;
  const sym = (c) => nn(c.root) + c.chord.sym;
  const keyName = `${nn(P.tonic)} ${st.mode}`;
  const pairs = [];
  if (II) pairs.push(['II → V', guideTones(II, V, st.mode)]);
  if (st.prog === 'i-v-i') pairs.push(['I → V', guideTones(I, V, st.mode)]);
  pairs.push(['V → I', guideTones(V, I, st.mode)]);
  const tri = tritone(V, I);
  const lbl = (c) => (n) => (st.labels === 'note' ? nn(transpose(c.root, n.iv)) : n.iv === '1' ? 'R' : n.iv);
  const scaleLink = (s) => `?k=escala&r=${s.pc}&t=${s.id}#/info`;
  const arpLink = (c) => `?k=arpegio&r=${notePc(c.root)}&t=${c.chord.id}#/info`;
  const uniq = [II, V, I].filter(Boolean);

  root.innerHTML = `<div class="view-pad tc-vi">
    ${back()}
    ${head('Relaciones V – I', 'El V crea tensión y el I la resuelve: seguí las notas guía.')}
    <section class="tc-box fx-pick">
      <div class="fx-row"><span>Tónica</span><div class="tc-chips roots12">${PICK_KEYS.map((p) => `<button data-root="${p}" class="${p === st.root ? 'on' : ''}">${nn(keyRoot(p, st.mode))}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Modo</span><div class="seg sm">${[['mayor', 'Mayor'], ['menor', 'Menor']].map(([id, n]) => `<button data-mode="${id}" class="${st.mode === id ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Enlace</span><div class="tc-chips">${PROGS.map(([id, n]) => `<button data-prog="${id}" class="${st.prog === id ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Acordes</span><div class="seg sm">${[['triadas', 'Tríadas'], ['7', 'Con 7ma']].map(([id, n]) => `<button data-level="${id}" class="${st.level === id ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Cuerdas</span><div class="tc-chips">${sets.map((s, i) => `<button data-set="${i}" class="${i === st.set ? 'on' : ''}">${setName(s)}</button>`).join('')}</div></div>
      <div class="fx-row"><span>Zona</span><div class="seg sm">${[[3, 'Grave'], [7, 'Media'], [11, 'Aguda']].map(([z, n]) => `<button data-zone="${z}" class="${Math.abs(st.zone - z) < 2 ? 'on' : ''}">${n}</button>`).join('')}</div></div>
    </section>
    <section class="fx-backing">
      <button class="tc-play" id="viPlay" data-space aria-label="Tocar la progresión en loop (espacio)">${ICON.play}${ICON.stop}<span>Tocar</span></button>
      <div class="fx-sym"><b>${P.chords.map(sym).join(' – ')}</b><small>${keyName} · ${P.chords.map((c) => c.roman).join(' – ')}</small></div>
      <div class="bpm"><button class="ib sm" data-vbpm="-5" aria-label="Más lento">${ICON.minus}</button><span><b id="viBpm">${metro.cfg.bpm}</b> bpm</span><button class="ib sm" data-vbpm="5" aria-label="Más rápido">${ICON.plus}</button></div>
      <div class="mini-seg" id="viBars" role="group" aria-label="Compases por acorde"><button data-bars="1" class="${st.bars === 1 ? 'on' : ''}">1 compás</button><button data-bars="2" class="${st.bars === 2 ? 'on' : ''}">2</button></div>
      <label class="sw"><input type="checkbox" id="viClick" ${st.click ? 'checked' : ''}> Clic</label>
    </section>
    <div class="vi-chords" style="--n:${P.chords.length}">${P.chords.map((c, i) => `<button class="vi-chord" data-ci="${i}" aria-label="${sym(c)}, ${c.roman}. Escuchar">
      <span class="vi-roman">${c.roman}</span><b>${sym(c)}</b><small>${c.notes.map(nn).join(' ')}</small>
      ${voic[i] ? chordBox(voic[i], { labels: lbl(c), title: sym(c), sub: c.roman, w: 120 }) : '<span class="tc-note">Sin voicing en estas cuerdas</span>'}
      <small class="vi-fn">${c.fn}</small></button>`).join('<span class="vi-arrow" aria-hidden="true">→</span>')}</div>
    <div class="vi-lbl seg sm" role="group" aria-label="Etiquetas">${[['interval', 'Intervalos'], ['note', 'Notas']].map(([id, n]) => `<button data-lbl="${id}" class="${st.labels === id ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="vi-grid">
      <section class="tc-box vi-guide">
        <h2 class="tc-h2">Notas guía</h2>
        <div class="viz-row">
          <figure class="sm">${viCircle(P, st.mode)}<figcaption><span class="fn-key"><span><i style="background:${FN_COLOR.Dominante}"></i>V</span><span><i style="background:${FN_COLOR.Tónica}"></i>I</span>${II ? `<span><i style="background:${FN_COLOR.Subdominante}"></i>II</span>` : ''}</span> · el V cae una 5ta al I</figcaption></figure>
        </div>
        <div class="viz-row vi-kbs">
          <figure>${viKeys(V)}<figcaption>${sym(V)}</figcaption></figure>
          <figure>${viKeys(I)}<figcaption>${sym(I)}</figcaption></figure>
        </div>
        ${roleLegend([1, 3, 5, ...(st.level === '7' ? [7] : [])])}
        ${pairs.map(([t, list]) => `<h3>${t}</h3><ul class="vi-moves">${list.map((g) => `<li><span class="vi-mv"><b>${nn(g.from)}</b><small>${g.fromIv}</small><i aria-hidden="true">${g.fromIv === '1' && g.toIv === '1' ? '→' : g.semis > 0 ? '↗' : g.semis < 0 ? '↘' : '→'}</i><b>${nn(g.to)}</b><small>${g.toIv}</small></span><span class="vi-txt">${g.text}</span></li>`).join('')}</ul>`).join('')}
        ${tri ? `<p class="tc-note vi-tri"><b>Tritono</b> ${nn(tri.t3)}–${nn(tri.t7)}: resuelve hacia adentro, a ${nn(tri.to3)} y ${nn(tri.to7)}.</p>` : ''}
        ${st.mode === 'menor' ? `<p class="tc-note">La sensible ${nn(V.notes[1])} viene de la <b>menor armónica</b>: por eso el V es mayor.</p>` : ''}
        <button class="plain sm" id="viGuide">${ICON.sound}<span>Escuchar solo las notas guía</span></button>
      </section>
      <section class="tc-box vi-what">
        <h2 class="tc-h2">Qué tocar</h2>
        ${uniq.map((c) => `<div class="vi-deg"><b>Sobre ${sym(c)}</b> <small>${c.roman}</small>
          <ul>${c.scales.map((s, k) => `<li><a href="${scaleLink(s)}">${scaleTitle(nn(s.root), s.scale)}</a>${k === 0 ? ' <em>principal</em>' : ''}</li>`).join('')}<li><a href="${arpLink(c)}">Arpegio ${sym(c)}</a> <small>${c.chord.intervals.join(' ')}</small></li></ul></div>`).join('')}
      </section>
    </div>
    <section class="tc-box vi-goal">
      <h2 class="tc-h2">Objetivo</h2>
      <ol>
        <li>Loop lento (60–70 bpm), sin cortar el sonido entre acordes.</li>
        <li>Terminá cada frase del V en la <b>3ra</b> (${nn(V.notes[1])}) y resolvé a ${nn(I.notes[0])}${st.level === '7' ? `; la <b>7ma</b> (${nn(V.notes[3])}) baja a ${nn(I.notes[1])}` : ''}.</li>
        <li>Cambiá de tónica y de cuerdas; subí 4 bpm cuando salga limpio 3 veces.</li>
      </ol>
    </section>
  </div>`;
  const $ = (id) => root.querySelector('#' + id);
  const bassOf = (c) => 40 + mod(notePc(c.root) - 4);
  const midisFor = (i) => [bassOf(P.chords[i]), ...(voic[i] ? voic[i].notes.map(midiOfNote) : [])];
  const cards = [...root.querySelectorAll('.vi-chord')];
  const mark = (i) => cards.forEach((c, k) => c.classList.toggle('now', k === i));
  const idxOf = (bar) => Math.floor(bar / st.bars) % P.chords.length;
  function start() {
    metro.set({ beats: 4, unit: 4, click: st.click, sub: 1, accents: defaultAccents(4, 4), gap: { on: false, play: 2, mute: 2 }, trainer: { on: false, step: 4, every: 4, max: 300, mode: 'up' } });
    hooks.onBeat = (beat, sub, bar, when, barDur) => { if (beat === 0 && sub === 0) audio.chordAt(midisFor(idxOf(bar)), when, barDur * st.bars * 0.95, 0.025, 0.5); };
    hooks.onVisual = (beat, sub, bar) => { if (beat === 0 && sub === 0) mark(idxOf(bar)); };
    metro.start();
  }
  const sync = () => {
    $('viPlay').classList.toggle('playing', metro.running);
    $('viPlay').querySelector('span').textContent = metro.running ? 'Parar' : 'Tocar';
    if (!metro.running) mark(-1);
  };
  hooks.onStop = () => setTimeout(() => $('viPlay') && sync());
  root.querySelector('.tc-vi').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const set = (k, v) => { metro.stop(); st[k] = v; save(); redraw(); };
    if (b.dataset.root != null) return set('root', Number(b.dataset.root));
    if (b.dataset.mode) return set('mode', b.dataset.mode);
    if (b.dataset.prog) return set('prog', b.dataset.prog);
    if (b.dataset.level) return set('level', b.dataset.level);
    if (b.dataset.set != null) return set('set', Number(b.dataset.set));
    if (b.dataset.zone) return set('zone', Number(b.dataset.zone));
    if (b.dataset.lbl) return set('labels', b.dataset.lbl);
    if (b.dataset.ci != null) { audio.playChord(midisFor(Number(b.dataset.ci)), { dur: 1.8, strum: 0.03 }); return; }
    if (b.id === 'viPlay') { metro.running ? metro.stop() : start(); sync(); return; }
    if (b.id === 'viGuide') {
      // las notas guía de cada enlace, en dos voces, en el registro medio
      const steps = [];
      pairs.forEach(([, list]) => { const g = list.filter((x) => x.fromIv !== '1' || x.toIv !== '1'); if (!g.length) return; const fm = g.map((x) => 60 + mod(notePc(x.from) - 0)); steps.push(fm, fm.map((m, k) => m + g[k].semis)); });
      audio.playSeq(steps, { step: 0.9, dur: 0.8 });
      return;
    }
    if (b.dataset.bars) { st.bars = Number(b.dataset.bars); save(); root.querySelectorAll('#viBars button').forEach((x) => x.classList.toggle('on', x === b)); return; }
    if (b.dataset.vbpm) { metro.cfg.bpm = Math.max(30, Math.min(240, metro.cfg.bpm + Number(b.dataset.vbpm))); saveMetroCfg(); $('viBpm').textContent = metro.cfg.bpm; }
  });
  $('viClick').addEventListener('change', (e) => { st.click = e.target.checked; save(); metro.set({ click: st.click }); });
  loadMetroCfgBpmOnly();
  $('viBpm').textContent = metro.cfg.bpm;
}
