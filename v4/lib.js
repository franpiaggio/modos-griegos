// Información básica: escalas (modos griegos, pentatónicas, menor armónica, menor melódica) y arpegios
// (tríadas, 7ma, extensiones) en posiciones, con la estética del libro. Basado en la v3.
import {
  build, SCALES, CHORDS, FAMILIES, CHORD_GROUPS, scalesOf, ROOT_PCS, rootLabel, noteName, PREF, midiOf,
  diatonic, IMPRO, pentatonicsIn, superimpositions, scaleById, transpose, ivSemis, EXTRA_SCALES, MAJOR_FUNCTIONS,
} from './theory.js';
import { sheetSvg, layoutLegend, boxOf } from './render.js';
import * as audio from './audio.js';
import { pieceSvg, pngBlob, save, printPiece, zipAll, slug } from './export.js';
import { $, store, prefs, onPrefs, toast, esc } from './ui.js';
import * as motion from './motion.js';
let drawn = false;

const ZOOMS = [0.5, 0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII'];
const CHORD_WORD = { mayor: 'mayor', menor: 'menor', dim: 'disminuido', aum: 'aumentado' };
const chordLabel = (c) => CHORD_WORD[c.id] || c.sym;
const SHORT = { mayor: 'Mayor', menor: 'Menor', dim: 'Dism.', aum: 'Aum.' };

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
  info: store.get('info', false),
};
const all = () => (state.kind === 'escala' ? SCALES : CHORDS);
if (!all().some((t) => t.id === state.type)) state.type = all()[0].id;
const cur = () => all().find((t) => t.id === state.type);
const groupOf = (t) => (state.kind === 'escala' ? t.fam : t.group);
// variantes = la familia (escalas) o el grupo (arpegios) del tipo actual
const types = () => all().filter((t) => groupOf(t) === groupOf(cur()));

let data = null;
let opts = null;
let mounted = false;

// ---------- dibujo ----------
function title(meta, rn) {
  if (state.kind === 'arpegio') return ['Arpegio', `${rn} ${chordLabel(meta)}`];
  if (meta.fam === 'mayor') return ['Modo', meta.name];
  if (meta.fam === 'penta') return ['Escala', meta.name];
  const isParent = FAMILIES.find((f) => f.id === meta.fam).parent === meta.id;
  return [isParent ? 'Escala' : 'Modo', meta.name];
}
function compute() {
  data = build(state.kind, state.root, state.type);
  const meta = data.meta;
  const n = prefs.notation;
  const names = PREF.map((p, pc) => noteName(data.spelled.get(pc) || p, n));
  const rn = noteName(data.root, n);
  const tonicColor = prefs.tonic === 'color' ? meta.color : '#1E1E1E';
  const display = state.kind === 'escala' ? `${rn} ${meta.name}` : `${rn} ${chordLabel(meta)}`;
  opts = {
    positions: data.positions, tonicPc: state.root, tonicColor, labelMode: prefs.labels, names, label: data.label,
    showNeck: prefs.neck === 'on', title: title(meta, rn), legend: [{ color: tonicColor, text: `Tónica ${rn}` }], rn, meta, display,
  };
}
function render() {
  compute();
  const paper = $('paper');
  paper.innerHTML = sheetSvg(opts);
  const svg = paper.querySelector('svg');
  document.fonts.ready.then(() => layoutLegend(svg));
  paper.classList.toggle('short', data.positions.length < 7);
  if (drawn) motion.swap(paper);
  drawn = true;
  markSelected();
  $('pickKind').textContent = `${state.kind === 'escala' ? 'Escala' : 'Arpegio'} · ${state.kind === 'escala' ? FAMILIES.find((f) => f.id === data.meta.fam).long : data.meta.group}`;
  $('pickName').textContent = opts.display;
  if (document.body.dataset.sec === 'info') document.title = `${opts.display} – Guitarra`;
  renderPicker();
  renderVariants();
  renderInfo();
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
  if (document.body.dataset.sec !== 'info') return;
  const u = new URL(location.href);
  u.searchParams.set('k', state.kind);
  u.searchParams.set('r', state.root);
  u.searchParams.set('t', state.type);
  if (state.zoom !== 1) u.searchParams.set('z', state.zoom); else u.searchParams.delete('z');
  history.replaceState(history.state, '', u);
}

// ---------- ficha (información básica) ----------
function chip(t, cls = '') { return `<span class="chip ${cls}">${esc(t)}</span>`; }
function scaleLink(id, pc, label) {
  return `<button class="lnk" data-go-k="escala" data-go-t="${id}" data-go-r="${pc}">${esc(label)}</button>`;
}
function chordLink(id, pc, label) {
  return `<button class="lnk" data-go-k="arpegio" data-go-t="${id}" data-go-r="${pc}">${esc(label)}</button>`;
}
function renderInfo() {
  const card = $('infoCard');
  card.hidden = !state.info;
  $('infoBtn').setAttribute('aria-pressed', state.info);
  $('infoBtn').classList.toggle('on', state.info);
  if (!state.info) return;
  const m = data.meta;
  const n = prefs.notation;
  const notes = m.intervals.map((iv) => noteName(transpose(data.root, iv), n));
  const rows = [];
  rows.push(`<div class="ic-row"><span>Fórmula</span><div>${m.intervals.map((iv) => chip(iv)).join('')}</div></div>`);
  rows.push(`<div class="ic-row"><span>Notas</span><div>${notes.map((x, i) => chip(x, i === 0 ? 'root' : '')).join('')}</div></div>`);
  if (state.kind === 'escala') {
    const fam = FAMILIES.find((f) => f.id === m.fam);
    if (m.char) rows.push(`<div class="ic-row"><span>Nota característica</span><div>${esc(m.char)}</div></div>`);
    if (m.intervals.length === 7) {
      const ds = diatonic(m.intervals, true);
      rows.push(`<div class="ic-row"><span>Acordes de la escala</span><div class="ds">${ds.map((d) => {
        const r = transpose(data.root, d.iv);
        const pc = (state.root + ivSemis(d.iv)) % 12;
        return `<span class="dch">${d.chord ? chordLink(d.chord.id, pc, noteName(r, n) + d.chord.sym) : '?'}<small>${esc(d.roman)}</small></span>`;
      }).join('')}</div></div>`);
    }
    const over = Object.entries(IMPRO).filter(([, v]) => v.scales.includes(m.id)).map(([k]) => k);
    const fn = MAJOR_FUNCTIONS.find((f) => f.scale === m.id);
    const uses = [];
    if (fn) uses.push(`${fn.roman} en tonalidad mayor (${fn.fn.toLowerCase()})`);
    if (over.length) uses.push('Acordes ' + over.map((k) => noteName(data.root, n) + (CHORDS.find((c) => c.id === k)?.sym ?? '')).join(', '));
    if (uses.length) rows.push(`<div class="ic-row"><span>Se usa sobre</span><div>${esc(uses.join(' · '))}</div></div>`);
    if (m.intervals.length === 7) {
      const pents = pentatonicsIn(state.root, m.intervals);
      if (pents.length) rows.push(`<div class="ic-row"><span>Pentatónicas que contiene</span><div>${pents.map((p) => scaleLink('penta-mayor', p.majorPc, noteName(PREF[p.majorPc], n) + ' mayor') + ' / ' + scaleLink('penta-menor', p.minorPc, noteName(PREF[p.minorPc], n) + ' menor')).join(' · ')}</div></div>`);
    }
    rows.push(`<p class="ic-note">${esc(fam.info)}${m.fam === 'armonica' || m.fam === 'melodica' ? ' Las figuras salen de las 7 posiciones de la escala mayor relativa, alterando las notas que cambian (por eso los modos comparten figuras).' : ''}</p>`);
  } else {
    const tones = new Set(m.intervals.map((iv) => (state.root + ivSemis(iv)) % 12));
    const containing = SCALES.filter((s) => {
      const set = new Set(s.intervals.map((iv) => (state.root + ivSemis(iv)) % 12));
      return [...tones].every((t) => set.has(t));
    });
    if (containing.length) rows.push(`<div class="ic-row"><span>Escalas (misma tónica) que lo contienen</span><div>${containing.map((s) => scaleLink(s.id, state.root, s.name)).join(' · ')}</div></div>`);
    const main = IMPRO[m.id]?.scales.map(scaleById).find((s) => s && s.intervals.length === 7);
    if (main) {
      const sup = superimpositions(state.root, main.intervals).filter((s) => s.deg !== 0 && s.chord);
      rows.push(`<div class="ic-row"><span>Arpegios superpuestos (sobre ${esc(main.name)})</span><div class="ds">${sup.map((s) => {
        const r = transpose(data.root, s.rootIv);
        const pc = (state.root + ivSemis(s.rootIv)) % 12;
        return `<span class="dch">${chordLink(s.chord.id, pc, noteName(r, n) + s.chord.sym)}<small>${s.tones.join('-')}</small></span>`;
      }).join('')}</div></div>`);
    }
    rows.push('<p class="ic-note">Notas del acorde dentro de las 7 zonas de la escala mayor de su fundamental. Digitación sugerida: un dedo por traste.</p>');
  }
  card.innerHTML = `<div class="ic-head"><b>${esc(opts.display)}</b>${m.alias ? `<small>${esc(m.alias)}</small>` : ''}</div>${rows.join('')}`;
}
function goTo(k, t, r) {
  stopPlay();
  state.kind = k;
  state.type = t;
  state.root = r;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- selector ----------
function renderPicker() {
  $('kindSeg').querySelectorAll('button').forEach((b) => {
    const on = b.dataset.kind === state.kind;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  $('roots').innerHTML = ROOT_PCS.map((p) => `<button data-r="${p}" class="${p === state.root ? 'on' : ''}" aria-pressed="${p === state.root}">${rootLabel(p, prefs.notation)}</button>`).join('');
  $('roots').querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  let html = '';
  let grp = null;
  all().forEach((t) => {
    const g = groupOf(t);
    if (g !== grp) { grp = g; html += `<div class="grp">${state.kind === 'escala' ? FAMILIES.find((f) => f.id === g).long : g}</div>`; }
    const name = state.kind === 'escala' ? t.name : `${esc(opts.rn)}${esc(t.sym)} <small class="sym">${esc(t.name)}</small>`;
    html += `<button data-t="${t.id}" class="${t.id === state.type ? 'on' : ''}" aria-current="${t.id === state.type}" title="${esc(t.intervals.join(' '))}" style="--c:${prefs.tonic === 'color' ? t.color : '#1E1E1E'}"><span class="dot"></span><span class="nm">${name}</span><small class="fx">${esc(t.intervals.join(' '))}</small></button>`;
  });
  $('types').innerHTML = html;
}
// En pantallas chicas la lista de escalas y arpegios es un cajón lateral; en las grandes está siempre visible.
let openPop = null;
function showPop() {
  openPop = { el: $('libNav'), btn: $('pickBtn') };
  document.body.classList.add('nav-open');
  $('scrim').hidden = false;
  $('pickBtn').setAttribute('aria-expanded', 'true');
  $('libNav').querySelector('.ln-list button.on')?.scrollIntoView({ block: 'center' });
  $('libNav').querySelector('.ln-list button.on, button')?.focus({ preventScroll: true });
}
function closePop() {
  if (!openPop) return;
  document.body.classList.remove('nav-open');
  $('pickBtn').setAttribute('aria-expanded', 'false');
  openPop = null;
  $('scrim').hidden = true;
}

// ---------- variantes ----------
function renderVariants() {
  const html = types().map((t) => {
    const label = state.kind === 'escala' ? t.name : (SHORT[t.id] || t.sym);
    const on = t.id === state.type;
    return `<button data-t="${t.id}" class="${on ? 'on' : ''}" aria-pressed="${on}" title="${esc(opts.rn + ' ' + t.name)}" style="--c:${prefs.tonic === 'color' ? t.color : '#1E1E1E'}">${esc(label)}</button>`;
  }).join('');
  ['variants', 'fVariants'].forEach((id) => {
    const el = $(id);
    el.innerHTML = html;
    el.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}
function pickVariant(e) {
  const b = e.target.closest('button[data-t]'); if (!b || b.dataset.t === state.type) return;
  const was = audio.isPlaying();
  stopPlay();
  state.type = b.dataset.t;
  if (state.playPos >= build(state.kind, state.root, state.type).positions.length) state.playPos = 0;
  if (typeof state.focus === 'number' && state.focus >= build(state.kind, state.root, state.type).positions.length) state.focus = 0;
  render();
  if (was && state.focus !== 'neck') startPlay();
}

// ---------- zoom ----------
function setZoom(z) {
  const paper = $('paper');
  const main = $('stage');
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

// ---------- vista ampliada ----------
const focusList = () => [...data.positions.map((_, i) => i), ...(opts.showNeck ? ['neck'] : [])];
const focusHash = (i) => `#/info/${i === 'neck' ? 'mastil' : 'p' + (i + 1)}`;
function openFocus(i, push = true) {
  if (typeof i === 'number' && i >= data.positions.length) return;
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
  if (push) history.pushState({ focus: i, pushed: true }, '', focusHash(i));
  $('focus').focus({ preventScroll: true });
}
function closeFocus(fromPop = false) {
  if (state.focus === null) return;
  state.focus = null;
  $('focus').hidden = true;
  document.body.style.overflow = '';
  document.body.classList.remove('in-focus');
  if (!fromPop) {
    if (history.state?.pushed) history.back();
    else history.replaceState(null, '', location.pathname + location.search + '#/info');
  }
}
function renderFocus() {
  const i = state.focus;
  const body = $('focusBody');
  body.innerHTML = sheetSvg(opts);
  const svg = body.querySelector('svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.querySelectorAll(i === 'neck' ? '.pos' : `.pos:not([data-i="${i}"]), .neck`).forEach((g) => g.remove());
  const [bx, by, bw, bh] = boxOf(i);
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
  if (i === 'neck') {
    $('focusTitle').textContent = 'Mástil completo';
    $('focusSub').textContent = opts.display;
  } else {
    const p = data.positions[i];
    $('focusTitle').textContent = `Posición ${i + 1} de ${data.positions.length}`;
    $('focusSub').textContent = `${opts.display} · trastes ${ROMAN[p.start]}–${ROMAN[p.start + 4]}`;
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
  const was = audio.isPlaying();
  stopPlay();
  state.focus = list[j];
  if (state.focus !== 'neck') state.playPos = state.focus;
  $('pPos').value = state.playPos;
  history.replaceState({ focus: state.focus, pushed: !!history.state?.pushed }, '', focusHash(state.focus));
  renderFocus();
  markSelected();
  if (was && state.focus !== 'neck') startPlay();
}
const FZ = [1, 1.35, 1.8, 2.4, 3];
let fz = 1;
function applyFz() {
  const b = $('focusBody');
  b.style.setProperty('--fz', fz);
  b.classList.toggle('zoomed', fz > 1);
  $('fzOut').disabled = fz === FZ[0];
  $('fzIn').disabled = fz === FZ[FZ.length - 1];
}

// ---------- reproducción ----------
function renderPlayerPositions() {
  const sel = $('pPos');
  if (state.playPos >= data.positions.length) state.playPos = 0;
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
  const up = notes.filter((n, i) => i === 0 || n.midi !== notes[i - 1].midi);
  if (state.dir === 'up') return up;
  if (state.dir === 'down') return [...up].reverse();
  return [...up, ...up.slice(0, -1).reverse()];
}
function flash(key) {
  document.querySelectorAll('#v-info .n.on').forEach((n) => n.classList.remove('on'));
  if (!key) return;
  document.querySelectorAll(`#v-info .n[data-k="${key}"]`).forEach((n) => {
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
  audio.play(sequence(), { bpm: state.bpm, loop: state.loop, onNote: flash, onEnd: () => setPlayingUi(false) });
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
const restartIfPlaying = () => { if (audio.isPlaying()) startPlay(); };

// ---------- exportar ----------
const pieceName = (i) => `${slug(opts.display)}-${i === 'neck' ? 'mastil' : 'posicion-' + (i + 1)}`;
function toggleDl(open) {
  const m = $('dlMenu');
  const show = open ?? m.hidden;
  m.hidden = !show;
  $('dlBtn').setAttribute('aria-expanded', show);
  if (show) m.querySelector('button').focus({ preventScroll: true });
}

// ---------- montaje ----------
export function mount() {
  mounted = true;
  $('pickBtn').addEventListener('click', () => (openPop ? closePop() : showPop()));
  $('navClose').addEventListener('click', closePop);
  $('scrim').addEventListener('click', closePop);
  $('kindSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.kind === state.kind) return;
    stopPlay();
    state.kind = b.dataset.kind;
    state.type = all()[0].id;
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
    if (!e.target.closest('button[data-t]')) return;
    pickVariant(e);
    closePop();
  });
  $('variants').addEventListener('click', pickVariant);
  $('fVariants').addEventListener('click', pickVariant);
  $('infoBtn').addEventListener('click', () => { state.info = !state.info; store.set('info', state.info); renderInfo(); });
  $('infoCard').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go-k]'); if (!b) return;
    goTo(b.dataset.goK, b.dataset.goT, Number(b.dataset.goR));
  });
  $('printBtn').addEventListener('click', () => { $('setBtn').click(); setTimeout(() => window.print(), 80); });
  $('zipBtn').addEventListener('click', async () => {
    $('setBtn').click();
    try {
      const list = focusList();
      toast(`Exportando 0 de ${list.length}…`, true);
      const blob = await zipAll(opts, list, slug(opts.display), (n, t) => toast(`Exportando ${n} de ${t}…`, true));
      save(blob, slug(opts.display) + '-posiciones.zip');
      toast('ZIP descargado (PNG y SVG de cada posición)');
    } catch (err) { console.error(err); toast('No se pudo exportar. Probá de nuevo.'); }
  });
  $('zoomIn').addEventListener('click', () => stepZoom(1));
  $('zoomOut').addEventListener('click', () => stepZoom(-1));
  $('zoomVal').addEventListener('click', () => setZoom(1));
  window.addEventListener('resize', () => { if (document.body.dataset.sec !== 'info') return; applyZoom(); if (state.focus !== null) renderFocus(); });
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
  $('fzIn').addEventListener('click', () => { fz = FZ[Math.min(FZ.length - 1, FZ.indexOf(fz) + 1)]; applyFz(); });
  $('fzOut').addEventListener('click', () => { fz = FZ[Math.max(0, FZ.indexOf(fz) - 1)]; applyFz(); });
  applyFz();
  let touchX = null;
  $('focusBody').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('focusBody').addEventListener('touchend', (e) => {
    if (touchX === null || fz > 1) { touchX = null; return; }
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) stepFocus(dx < 0 ? 1 : -1);
  });
  $('paper').addEventListener('click', (e) => {
    const g = e.target.closest('.pos, .neck'); if (!g) return;
    openFocus(g.dataset.i === 'neck' ? 'neck' : Number(g.dataset.i));
  });
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
  $('bpmDown').addEventListener('click', () => { state.bpm = Math.max(40, state.bpm - 10); store.set('bpm', state.bpm); $('bpmVal').textContent = state.bpm; restartIfPlaying(); });
  $('bpmUp').addEventListener('click', () => { state.bpm = Math.min(240, state.bpm + 10); store.set('bpm', state.bpm); $('bpmVal').textContent = state.bpm; restartIfPlaying(); });
  $('dirSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    state.dir = b.dataset.dir; store.set('dir', state.dir); renderPlayerPositions(); restartIfPlaying();
  });
  $('loopBtn').addEventListener('click', () => { state.loop = !state.loop; store.set('loop', state.loop); renderPlayerPositions(); restartIfPlaying(); });
  $('dlBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleDl(); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.dl-wrap')) toggleDl(false); });
  $('dlMenu').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    toggleDl(false);
    const i = state.focus;
    try {
      toast('Preparando…', true);
      const piece = await pieceSvg(opts, i);
      if (b.dataset.fmt === 'svg') save(new Blob([piece.text], { type: 'image/svg+xml' }), pieceName(i) + '.svg');
      else if (b.dataset.fmt === 'png') save(await pngBlob(piece), pieceName(i) + '.png');
      else printPiece(piece);
      toast(b.dataset.fmt === 'pdf' ? 'Elegí “Guardar como PDF” en el diálogo' : 'Descargado');
    } catch (err) { console.error(err); toast('No se pudo exportar. Probá de nuevo.'); }
  });
  window.addEventListener('keydown', onKey);
  onPrefs(() => mounted && render());
  if (store.get('seenFocus', false)) $('hintM').hidden = true;
  render();
}

function onKey(e) {
  if (document.body.dataset.sec !== 'info') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (!$('settings').hidden) return;
  const tag = e.target.tagName;
  if (tag === 'SELECT' || tag === 'INPUT') return;
  if (e.key === 'Escape') {
    if (!$('dlMenu').hidden) { toggleDl(false); $('dlBtn').focus(); return; }
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
    if (i >= data.positions.length) return;
    if (state.focus !== null) stepFocus(focusList().indexOf(i) - focusList().indexOf(state.focus));
    else openFocus(i);
  } else if (e.key === '[' || e.key === ']') {
    const list = types();
    const j = list.findIndex((t) => t.id === state.type) + (e.key === ']' ? 1 : -1);
    if (j >= 0 && j < list.length) $('variants').querySelector(`[data-t="${list[j].id}"]`).click();
  } else if (e.key === '+' || e.key === '=') (state.focus !== null ? $('fzIn').click() : stepZoom(1));
  else if (e.key === '-') (state.focus !== null ? $('fzOut').click() : stepZoom(-1));
}

// sub: '' | 'p3' | 'mastil'
export function route(sub) {
  syncUrl();
  if (opts) document.title = `${opts.display} – Guitarra`;
  const m = sub.match(/^p(\d)$/);
  if (m) { if (state.focus !== Number(m[1]) - 1) openFocus(Number(m[1]) - 1, false); }
  else if (sub === 'mastil' && opts.showNeck) { if (state.focus !== 'neck') openFocus('neck', false); }
  else if (state.focus !== null) { stopPlay(); closeFocus(true); }
}
export function leave() {
  stopPlay();
  closePop();
  if (state.focus !== null) closeFocus(true);
}
