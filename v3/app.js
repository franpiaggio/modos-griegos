import { build, MODES, CHORDS, ROOTS, NOTE_NAMES, rootName, rootLabel, spell, midiOf } from './theory.js';
import { sheetSvg, layoutLegend, boxOf } from './render.js';
import * as audio from './audio.js';

const $ = (id) => document.getElementById(id);
const ZOOMS = [0.5, 0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];
const CHORD_TITLE = { mayor: 'mayor', menor: 'menor', maj7: 'maj7', m7: 'm7', dom7: '7', m7b5: 'm7(b5)', dim7: 'dim7' };

// ---------- estado ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('v3.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('v3.' + k, JSON.stringify(v)); } catch {} },
};
const settings = Object.assign({ tonic: 'negra', labels: 'finger', notation: 'latin', neck: 'on' }, store.get('settings', {}));
const q = new URLSearchParams(location.search);
const state = {
  kind: q.get('k') === 'arpegio' ? 'arpegio' : 'escala',
  root: Math.min(11, Math.max(0, Number(q.get('r')) || 0)),
  type: q.get('t') || '',
  zoom: ZOOMS.includes(Number(q.get('z'))) ? Number(q.get('z')) : store.get('zoom', 1),
  focus: null,
  playPos: 0,
  bpm: store.get('bpm', 80),
  dir: store.get('dir', 'both'),
  loop: store.get('loop', false),
};
const types = () => (state.kind === 'escala' ? MODES : CHORDS);
if (!types().some((t) => t.id === state.type)) state.type = types()[0].id;

let data = null; // resultado de build()
let opts = null; // opciones de dibujo

// ---------- dibujo ----------
function compute() {
  data = build(state.kind, state.root, state.type);
  const meta = state.kind === 'escala' ? data.mode : data.chord;
  const spelled = spell(state.root, meta.intervals, settings.notation);
  const names = NOTE_NAMES[settings.notation].map((n, p) => spelled.get(p) || n);
  const rn = rootName(state.root, settings.notation, meta.intervals);
  const tonicColor = settings.tonic === 'color' ? meta.color : '#1E1E1E';
  opts = {
    positions: data.positions,
    tonicPc: state.root,
    tonicColor,
    labelMode: settings.labels,
    names,
    label: data.label,
    showNeck: settings.neck === 'on',
    title: state.kind === 'escala' ? ['Modo', meta.name] : ['Arpegio', `${rn} ${CHORD_TITLE[meta.id]}`],
    legend: [{ color: tonicColor, text: `Tónica ${rn}` }],
    rn, meta,
    display: state.kind === 'escala' ? `${rn} ${meta.name}` : `${rn} ${CHORD_TITLE[meta.id]}`,
  };
}

function afterFonts(svg) {
  document.fonts.ready.then(() => layoutLegend(svg));
}

function render() {
  compute();
  const paper = $('paper');
  paper.innerHTML = sheetSvg(opts);
  const svg = paper.querySelector('svg');
  afterFonts(svg);
  markSelected();
  // selector
  $('pickKind').textContent = state.kind === 'escala' ? 'Escala' : 'Arpegio';
  $('pickName').textContent = opts.display;
  document.title = `${opts.display} – Escalas y arpegios`;
  renderPicker();
  renderPlayerPositions();
  if (state.focus !== null) renderFocus();
  applyZoom();
  syncUrl();
}

function applyZoom() {
  const base = Math.min(860, window.innerWidth - (window.innerWidth < 760 ? 16 : 32));
  document.documentElement.style.setProperty('--paper-w', `${Math.round(base * state.zoom)}px`);
  $('zoomVal').textContent = `${Math.round(state.zoom * 100)}%`;
}

function syncUrl() {
  const u = new URL(location.href);
  u.searchParams.set('k', state.kind);
  u.searchParams.set('r', state.root);
  u.searchParams.set('t', state.type);
  if (state.zoom !== 1) u.searchParams.set('z', state.zoom); else u.searchParams.delete('z');
  history.replaceState(history.state, '', u);
}

// ---------- selector ----------
function renderPicker() {
  $('kindSeg').querySelectorAll('button').forEach((b) => {
    const on = b.dataset.kind === state.kind;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  $('roots').innerHTML = ROOTS.map(([p]) => `<button data-r="${p}" class="${p === state.root ? 'on' : ''}" aria-pressed="${p === state.root}">${rootLabel(p, settings.notation)}</button>`).join('');
  $('typeLbl').textContent = state.kind === 'escala' ? 'Modo' : 'Tipo';
  let html = '';
  let grp = null;
  types().forEach((t) => {
    if (t.group && t.group !== grp) { grp = t.group; html += `<div class="grp">${grp}</div>`; }
    const sub = state.kind === 'escala' ? (t.alias || t.intervals.join(' ')) : t.intervals.join(' ');
    html += `<button data-t="${t.id}" class="${t.id === state.type ? 'on' : ''}" style="--c:${settings.tonic === 'color' ? t.color : '#1E1E1E'}"><span class="dot"></span><span><b>${t.name}</b><small>${sub}</small></span></button>`;
  });
  $('types').innerHTML = html;
}

// ---------- popovers ----------
let openPop = null;
function showPop(id, btn) {
  closePop();
  openPop = { el: $(id), btn };
  $(id).hidden = false;
  $('scrim').hidden = false;
  btn?.setAttribute('aria-expanded', 'true');
  const first = $(id).querySelector('button.on, button');
  first?.focus({ preventScroll: true });
}
function closePop() {
  if (!openPop) return;
  openPop.el.hidden = true;
  openPop.btn?.setAttribute('aria-expanded', 'false');
  openPop.btn?.focus({ preventScroll: true });
  openPop = null;
  $('scrim').hidden = true;
}
$('pickBtn').addEventListener('click', () => (openPop?.el.id === 'picker' ? closePop() : showPop('picker', $('pickBtn'))));
$('setBtn').addEventListener('click', () => (openPop?.el.id === 'settings' ? closePop() : showPop('settings', $('setBtn'))));
$('scrim').addEventListener('click', closePop);

$('kindSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.dataset.kind === state.kind) return;
  stopPlay();
  state.kind = b.dataset.kind;
  state.type = types()[0].id;
  render();
});
$('roots').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  stopPlay();
  state.root = Number(b.dataset.r);
  render();
  $('roots').querySelector(`[data-r="${state.root}"]`)?.focus({ preventScroll: true });
});
$('types').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  stopPlay();
  state.type = b.dataset.t;
  render();
  closePop();
});

// ---------- configuración ----------
function renderSettings() {
  document.querySelectorAll('#settings .seg[data-set]').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', settings[seg.dataset.set] === b.dataset.v));
  });
}
$('settings').addEventListener('click', (e) => {
  const b = e.target.closest('.seg[data-set] button'); if (!b) return;
  settings[b.closest('.seg').dataset.set] = b.dataset.v;
  store.set('settings', settings);
  renderSettings();
  render();
});
$('printBtn').addEventListener('click', () => { closePop(); setTimeout(() => window.print(), 50); });

// ---------- zoom ----------
function setZoom(z) {
  const paper = $('paper');
  const main = $('stage');
  // mantiene el centro de la vista al cambiar el tamaño
  const r = paper.getBoundingClientRect();
  const cy = (window.innerHeight / 2 - r.top) / r.height;
  const cx = (main.clientWidth / 2 + main.scrollLeft - paper.offsetLeft) / paper.offsetWidth;
  state.zoom = z;
  store.set('zoom', z);
  applyZoom();
  syncUrl();
  requestAnimationFrame(() => setTimeout(() => {
    const r2 = paper.getBoundingClientRect();
    window.scrollBy(0, r2.top + cy * r2.height - window.innerHeight / 2);
    main.scrollLeft = paper.offsetLeft + cx * paper.offsetWidth - main.clientWidth / 2;
  }, 220));
}
const stepZoom = (d) => {
  const i = ZOOMS.indexOf(state.zoom);
  const n = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? ZOOMS.indexOf(1) : i) + d))];
  if (n !== state.zoom) setZoom(n);
};
$('zoomIn').addEventListener('click', () => stepZoom(1));
$('zoomOut').addEventListener('click', () => stepZoom(-1));
$('zoomVal').addEventListener('click', () => setZoom(1));
window.addEventListener('resize', () => { applyZoom(); if (state.focus !== null) renderFocus(); });

// ---------- vista ampliada ----------
const focusList = () => [...data.positions.map((_, i) => i), ...(opts.showNeck ? ['neck'] : [])];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII'];

function openFocus(i, push = true) {
  state.focus = i;
  if (i !== 'neck') state.playPos = i;
  $('focus').hidden = false;
  document.body.classList.add('in-focus');
  $('pPos').value = state.playPos;
  store.set('seenFocus', true);
  $('hintM').hidden = true;
  document.body.style.overflow = 'hidden';
  renderFocus();
  markSelected();
  if (push) history.pushState({ focus: i }, '', `#${i === 'neck' ? 'mastil' : 'p' + (i + 1)}`);
  $('focus').focus({ preventScroll: true });
}
function closeFocus(fromPop = false) {
  if (state.focus === null) return;
  state.focus = null;
  $('focus').hidden = true;
  document.body.style.overflow = '';
  if (!fromPop) {
    if (history.state?.focus != null) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  }
  document.body.classList.remove('in-focus');
}
function renderFocus() {
  const i = state.focus;
  const body = $('focusBody');
  body.innerHTML = sheetSvg(opts);
  const svg = body.querySelector('svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.querySelectorAll(i === 'neck' ? '.pos' : `.pos:not([data-i="${i}"]), .neck`).forEach((g) => g.remove());
  const [bx, by, bw, bh] = boxOf(i);
  // En pantallas verticales la posición se gira (cejuela arriba, 6ta cuerda a la izquierda) y los textos quedan derechos.
  const vertical = i !== 'neck' && body.clientHeight > body.clientWidth * 1.1;
  body.classList.toggle('vertical', vertical);
  if (vertical) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', 'rotate(90)');
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(g);
    svg.setAttribute('viewBox', [-(by + bh), bx, bh, bw].join(' '));
    g.querySelectorAll('.pos text').forEach((t) => {
      const fs = parseFloat(getComputedStyle(t).fontSize) || 14;
      const x = Number(t.getAttribute('x'));
      const y = Number(t.getAttribute('y')) - fs * 0.36;
      t.setAttribute('transform', `rotate(-90 ${x} ${y})`);
    });
  } else {
    svg.setAttribute('viewBox', [bx, by, bw, bh].join(' '));
  }
  svg.setAttribute('aria-label', i === 'neck' ? 'Mástil completo' : `Posición ${i + 1}`);
  const name = opts.display;
  if (i === 'neck') {
    $('focusTitle').textContent = 'Mástil completo';
    $('focusSub').textContent = name;
  } else {
    const p = data.positions[i];
    $('focusTitle').textContent = `Posición ${i + 1} de ${data.positions.length}`;
    $('focusSub').textContent = `${name} · trastes ${ROMAN[p.start]}–${ROMAN[p.start + 4]}`;
  }
  const list = focusList();
  $('fDots').innerHTML = list.map((x) => `<button data-f="${x}" class="${x === i ? 'on' : ''}" aria-label="${x === 'neck' ? 'Mástil completo' : 'Posición ' + (x + 1)}">${x === 'neck' ? 'M' : x + 1}</button>`).join('');
  $('fPrev').disabled = list.indexOf(i) === 0;
  $('fNext').disabled = list.indexOf(i) === list.length - 1;
}
function stepFocus(d) {
  const list = focusList();
  const j = list.indexOf(state.focus) + d;
  if (j < 0 || j >= list.length) return;
  const wasPlaying = audio.isPlaying();
  stopPlay();
  state.focus = list[j];
  if (state.focus !== 'neck') state.playPos = state.focus;
  $('pPos').value = state.playPos;
  history.replaceState({ focus: state.focus }, '', `#${state.focus === 'neck' ? 'mastil' : 'p' + (state.focus + 1)}`);
  renderFocus();
  markSelected();
  if (wasPlaying && state.focus !== 'neck') startPlay();
}
$('fPrev').addEventListener('click', () => stepFocus(-1));
$('fNext').addEventListener('click', () => stepFocus(1));
$('fClose').addEventListener('click', () => { stopPlay(); closeFocus(); });
$('fDots').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const v = b.dataset.f === 'neck' ? 'neck' : Number(b.dataset.f);
  stepFocus(focusList().indexOf(v) - focusList().indexOf(state.focus));
});
$('focusBody').addEventListener('click', (e) => {
  const n = e.target.closest('.n'); if (!n) return;
  const [s, f] = n.dataset.k.split(':').map(Number);
  audio.pluck(midiOf(s, f));
  flash(n.dataset.k);
});
// tamaño propio de la vista ampliada
const FZ = [1, 1.35, 1.8, 2.4, 3];
let fz = 1;
function applyFz() {
  const b = $('focusBody');
  b.style.setProperty('--fz', fz);
  b.classList.toggle('zoomed', fz > 1);
  $('fzOut').disabled = fz === FZ[0];
  $('fzIn').disabled = fz === FZ[FZ.length - 1];
}
$('fzIn').addEventListener('click', () => { fz = FZ[Math.min(FZ.length - 1, FZ.indexOf(fz) + 1)]; applyFz(); });
$('fzOut').addEventListener('click', () => { fz = FZ[Math.max(0, FZ.indexOf(fz) - 1)]; applyFz(); });
applyFz();

// deslizar para cambiar de posición (solo sin zoom, para no pelear con el desplazamiento)
let touchX = null;
$('focusBody').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
$('focusBody').addEventListener('touchend', (e) => {
  if (touchX === null || fz > 1) { touchX = null; return; }
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 50) stepFocus(dx < 0 ? 1 : -1);
});
window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#p(\d)$/);
  if (m) openFocus(Number(m[1]) - 1, false);
  else if (location.hash === '#mastil') openFocus('neck', false);
  else { stopPlay(); closeFocus(true); }
});

$('paper').addEventListener('click', (e) => {
  const g = e.target.closest('.pos, .neck'); if (!g) return;
  openFocus(g.dataset.i === 'neck' ? 'neck' : Number(g.dataset.i));
});

// ---------- reproducción ----------
function renderPlayerPositions() {
  const sel = $('pPos');
  sel.innerHTML = data.positions.map((p, i) => `<option value="${i}">${i + 1} · ${ROMAN[p.start]}</option>`).join('');
  sel.value = state.playPos;
  $('bpmVal').textContent = state.bpm;
  $('dirSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.dir === state.dir));
  $('loopBtn').setAttribute('aria-pressed', state.loop);
}
function markSelected() {
  const show = !$('player').hidden;
  document.querySelectorAll('#paper .pos').forEach((g) => g.classList.toggle('sel', show && Number(g.dataset.i) === state.playPos));
}
function sequence() {
  const notes = [...data.positions[state.playPos].notes].map(([s, f]) => ({ midi: midiOf(s, f), key: `${s}:${f}`, s }))
    .sort((a, b) => a.midi - b.midi || b.s - a.s);
  // sin repetir alturas (misma nota en dos cuerdas)
  const up = notes.filter((n, i) => i === 0 || n.midi !== notes[i - 1].midi);
  if (state.dir === 'up') return up;
  if (state.dir === 'down') return [...up].reverse();
  return [...up, ...up.slice(0, -1).reverse()];
}
function flash(key) {
  document.querySelectorAll('.n.on').forEach((n) => n.classList.remove('on'));
  if (!key) return;
  document.querySelectorAll(`.n[data-k="${key}"]`).forEach((n) => {
    const pos = n.closest('.pos');
    if (pos && !pos.closest('#focusBody') && Number(pos.dataset.i) !== state.playPos) return;
    n.classList.add('on');
  });
}
function setPlayingUi(on) {
  $('playBtn').classList.toggle('playing', on);
  $('pPlay').classList.toggle('playing', on);
  $('playBtn').setAttribute('aria-label', on ? 'Detener (espacio)' : 'Reproducir (espacio)');
}
function startPlay() {
  showPlayer();
  setPlayingUi(true);
  audio.play(sequence(), {
    bpm: state.bpm, loop: state.loop, onNote: flash,
    onEnd: () => setPlayingUi(false),
  });
}
function stopPlay() {
  audio.stop();
  flash(null);
  setPlayingUi(false);
}
const togglePlay = () => (audio.isPlaying() ? stopPlay() : startPlay());
function showPlayer() {
  if (!$('player').hidden) return;
  $('player').hidden = false;
  renderPlayerPositions();
  markSelected();
}
$('playBtn').addEventListener('click', togglePlay);
$('pPlay').addEventListener('click', togglePlay);
$('pClose').addEventListener('click', () => { stopPlay(); $('player').hidden = true; markSelected(); });
$('pPos').addEventListener('change', (e) => {
  const was = audio.isPlaying();
  stopPlay();
  state.playPos = Number(e.target.value);
  markSelected();
  if (state.focus !== null && state.focus !== 'neck') { state.focus = state.playPos; renderFocus(); }
  if (was) startPlay();
});
const restartIfPlaying = () => { if (audio.isPlaying()) startPlay(); };
$('bpmDown').addEventListener('click', () => { state.bpm = Math.max(40, state.bpm - 10); store.set('bpm', state.bpm); $('bpmVal').textContent = state.bpm; restartIfPlaying(); });
$('bpmUp').addEventListener('click', () => { state.bpm = Math.min(240, state.bpm + 10); store.set('bpm', state.bpm); $('bpmVal').textContent = state.bpm; restartIfPlaying(); });
$('dirSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.dir = b.dataset.dir; store.set('dir', state.dir); renderPlayerPositions(); restartIfPlaying();
});
$('loopBtn').addEventListener('click', () => { state.loop = !state.loop; store.set('loop', state.loop); renderPlayerPositions(); restartIfPlaying(); });

// ---------- teclado ----------
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'SELECT' || tag === 'INPUT') return;
  if (e.key === 'Escape') {
    if (openPop) closePop();
    else if (state.focus !== null) { stopPlay(); closeFocus(); }
    return;
  }
  if (openPop) return;
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const d = e.key === 'ArrowRight' ? 1 : -1;
    if (state.focus !== null) stepFocus(d);
    else { const was = audio.isPlaying(); stopPlay(); state.playPos = Math.max(0, Math.min(data.positions.length - 1, state.playPos + d)); renderPlayerPositions(); markSelected(); if (was) startPlay(); }
  } else if (/^[1-7]$/.test(e.key)) {
    const i = Number(e.key) - 1;
    if (state.focus !== null) stepFocus(focusList().indexOf(i) - focusList().indexOf(state.focus));
    else openFocus(i);
  } else if (e.key === '+' || e.key === '=') (state.focus !== null ? $('fzIn').click() : stepZoom(1));
  else if (e.key === '-') (state.focus !== null ? $('fzOut').click() : stepZoom(-1));
});

// ---------- inicio ----------
if (store.get('seenFocus', false)) $('hintM').hidden = true;
renderSettings();
render();
const m = location.hash.match(/^#p(\d)$/);
if (m) openFocus(Number(m[1]) - 1, false);
else if (location.hash === '#mastil' && opts.showNeck) openFocus('neck', false);
