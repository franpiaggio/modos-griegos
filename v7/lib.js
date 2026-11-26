// Información básica: escalas (modos griegos, pentatónicas, menor armónica, menor melódica) y arpegios
// (tríadas, 7ma, extensiones) en posiciones, con la estética del libro. Basado en la v3.
import {
  build, SCALES, CHORDS, FAMILIES, CHORD_GROUPS, ARP_GROUPS, scalesOf, ROOT_PCS, rootLabel, noteName, PREF, midiOf,
  diatonic, IMPRO, pentatonicsIn, superimpositions, scaleById, transpose, ivSemis, EXTRA_SCALES, MAJOR_FUNCTIONS, intervalBetween,
} from './theory.js';
import { steps, clock, stack, roleLegend, roleOf, ROLE } from './viz.js';
import { sheetSvg, layoutLegend, boxOf } from './render.js';
import * as audio from './audio.js';
import { pieceSvg, pngBlob, save, printPiece, zipAll, slug } from './export.js';
import { $, store, prefs, onPrefs, toast, esc, setPref } from './ui.js';
import { unlockedInfo, CHAPTERS, prevGate } from './logros.js';
import * as Gt from './guitar.js';
import { icon } from './icons.js';
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
// arpegios: solo tríadas y con 7ma (las extensiones quedan para más adelante)
const ARPS = CHORDS.filter((c) => ARP_GROUPS.includes(c.group));
const all = () => (state.kind === 'escala' ? SCALES : ARPS);
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
  if (meta.fam === 'penta') return meta.name.startsWith('Escala ') ? ['Escala', meta.name.slice(7)] : ['Escala', meta.name];
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
  const display = state.kind === 'escala' ? (meta.name.startsWith('Escala ') ? `${meta.name} de ${rn}` : `${rn} ${meta.name}`) : `${rn} ${chordLabel(meta)}`;
  opts = {
    positions: data.positions, tonicPc: state.root, tonicColor, labelMode: prefs.labels, names, label: data.label,
    showNeck: prefs.neck === 'on', title: title(meta, rn), rn, meta, display,
    marks: new Map(data.marks.map((m) => [m.pc, m.color])),
    legend: [{ color: tonicColor, text: `Tónica ${rn}` }, ...data.marks.map((m) => ({ color: m.color, text: m.root ? `${m.text} ${names[m.pc]}` : m.text }))],
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
  $('pickKind').textContent = state.kind === 'escala'
    ? [FAMILIES.find((f) => f.id === data.meta.fam).long, data.meta.alias].filter(Boolean).join(' · ')
    : `Arpegio · ${data.meta.group === 'Con 7ma' ? 'con 7ma' : data.meta.group.toLowerCase()} · ${data.meta.intervals.join(' ')}`;
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
const CHAR_COLOR = '#CE3468'; // nota característica en el reloj
function renderInfo() {
  const card = $('infoCard');
  card.hidden = !state.info;
  $('infoBtn').setAttribute('aria-pressed', state.info);
  $('infoBtn').classList.toggle('on', state.info);
  if (!state.info) return;
  const m = data.meta;
  const n = prefs.notation;
  const spelled = m.intervals.map((iv) => transpose(data.root, iv));
  const notes = spelled.map((x) => noteName(x, n));
  const rows = [];
  if (state.kind === 'escala') {
    const fam = FAMILIES.find((f) => f.id === m.fam);
    // nota característica: los intervalos de la fórmula que aparecen en su descripción ("#4", "b6 y 7")
    const charIvs = new Set((String(m.char || '').match(/(bb|b|#)?\d+/g) || []).filter((iv) => m.intervals.includes(iv)));
    const markOf = new Map(data.marks.map((mk) => [mk.pc, mk]));
    const pcOfIv = (iv) => (state.root + ivSemis(iv)) % 12;
    // si la característica ya está marcada con su color (blue note, nota mixolidia, alteración), no se repite
    [...charIvs].forEach((iv) => markOf.has(pcOfIv(iv)) && charIvs.delete(iv));
    const markIdx = new Set(m.intervals.map((iv, i) => (charIvs.has(iv) || markOf.has(pcOfIv(iv)) ? i : -1)).filter((i) => i > 0));
    const items = m.intervals.map((iv, i) => {
      const mk = markOf.get(pcOfIv(iv));
      return { k: ivSemis(iv), name: notes[i], iv, color: i === 0 ? ROLE[1] : mk ? mk.color : charIvs.has(iv) ? CHAR_COLOR : '#8a8a93' };
    });
    rows.push(`<div class="viz-row">
      <figure class="wide">${steps([...notes, notes[0]], m.intervals, { label: `Tonos y semitonos de ${opts.display}`, mark: markIdx })}<figcaption>Fórmula y distancias${charIvs.size ? ` · <span class="ic-char"><i></i>característica: <b>${esc([...charIvs].join(', '))}</b></span>` : ''}</figcaption></figure>
      <figure class="sm">${clock(items, { label: `Reloj cromático de ${opts.display}`, size: 200 })}<figcaption>Las 12 notas, con la tónica arriba</figcaption></figure>
    </div>`);
    if (data.marks.length) rows.push(`<p class="viz-legend">${data.marks.map((mk) => `<span><i style="background:${mk.color}"></i>${esc(mk.text)}${mk.root ? ' ' : ' · '}${noteName(data.spelled.get(mk.pc) || PREF[mk.pc], n)}</span>`).join('')}</p>`);
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
    if (fn) uses.push(chip(`${fn.roman} · ${fn.fn.toLowerCase()}`));
    over.forEach((k) => uses.push(chip(noteName(data.root, n) + (CHORDS.find((c) => c.id === k)?.sym ?? ''))));
    if (uses.length) rows.push(`<div class="ic-row"><span>Se usa sobre</span><div>${uses.join('')}</div></div>`);
    if (m.intervals.length === 7) {
      const pents = pentatonicsIn(state.root, m.intervals);
      if (pents.length) rows.push(`<div class="ic-row"><span>Pentatónicas adentro</span><div class="ds">${pents.map((p) => `<span class="dch">${scaleLink('penta-mayor', p.majorPc, noteName(PREF[p.majorPc], n) + ' mayor')}<small>= ${scaleLink('penta-menor', p.minorPc, noteName(PREF[p.minorPc], n) + ' menor')}</small></span>`).join('')}</div></div>`);
    }
    rows.push(`<p class="ic-note">${esc(fam.info)}</p>`);
  } else {
    const gaps = spelled.slice(1).map((x, i) => intervalBetween(spelled[i], x).id);
    rows.push(`<div class="viz-row">
      <figure class="sm">${stack(m.intervals.map((iv, i) => ({ name: notes[i], iv })), gaps, { label: `${opts.display} apilado por terceras` })}<figcaption>Apilado por terceras</figcaption></figure>
      <figure class="neckf">${(() => { const s = [5, 6].map((x) => ({ s: x, f: Gt.fretOf(state.root, x, 0) })).sort((a, b) => a.f - b.f)[0]; return Gt.oneString(data.root, m.intervals, { s: s.s, startFret: s.f, inOctave: true, label: 'iv', color: (iv) => ROLE[roleOf(iv)], title: `${opts.display} en una cuerda` }); })()}<figcaption>En una sola cuerda: la distancia de cada nota a la tónica, en trastes${m.intervals.some((iv) => /9|11|13/.test(iv)) ? ' (las 9, 11 y 13 se muestran dentro de la octava)' : ''}</figcaption></figure>
    </div>${roleLegend([...new Set(m.intervals.map(roleOf))])}`);
    const tones = new Set(m.intervals.map((iv) => (state.root + ivSemis(iv)) % 12));
    const containing = SCALES.filter((s) => {
      const set = new Set(s.intervals.map((iv) => (state.root + ivSemis(iv)) % 12));
      return [...tones].every((t) => set.has(t));
    });
    if (containing.length) rows.push(`<div class="ic-row"><span>Escalas que lo contienen</span><div class="ds">${containing.map((s) => `<span class="dch">${scaleLink(s.id, state.root, s.name)}</span>`).join('')}</div></div>`);
    const main = IMPRO[m.id]?.scales.map(scaleById).find((s) => s && s.intervals.length === 7);
    if (main) {
      const sup = superimpositions(state.root, main.intervals).filter((s) => s.deg !== 0 && s.chord);
      rows.push(`<div class="ic-row"><span>Arpegios superpuestos</span><div class="ds">${sup.map((s) => {
        const r = transpose(data.root, s.rootIv);
        const pc = (state.root + ivSemis(s.rootIv)) % 12;
        return `<span class="dch">${chordLink(s.chord.id, pc, noteName(r, n) + s.chord.sym)}<small>${s.tones.join('-')}</small></span>`;
      }).join('')}</div></div>`);
    }
    rows.push('<p class="ic-note">Posiciones con la tónica en el dedo 1, un dedo por traste.</p>');
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
    const lk = unlockedInfo(state.kind, t.id);
    const lockTip = lk.ok ? '' : `Se abre al llegar al capítulo ${lk.chapter.n}`;
    html += `<button data-t="${t.id}" class="${t.id === state.type ? 'on' : ''}${lk.ok ? '' : ' locked'}" aria-current="${t.id === state.type}"${lk.ok ? '' : ' aria-disabled="true"'} title="${esc(lockTip || t.intervals.join(' '))}" style="--c:${prefs.tonic === 'color' ? t.color : '#1E1E1E'}"><span class="dot"></span><span class="nm">${name}${lk.ok ? '' : `<span class="sr"> (bloqueado: ${lockTip})</span>`}</span>${lk.ok ? `<small class="fx">${esc(t.intervals.join(' '))}</small>` : icon('lock', 'lk')}</button>`;
  });
  $('types').innerHTML = html;
  applyLock();
}
// v5: la información se desbloquea por capítulos (ver logros.js). Un ítem bloqueado muestra un aviso en lugar de la hoja.
let stageLocked = false;
function applyLock() {
  const lk = unlockedInfo(state.kind, state.type);
  stageLocked = !lk.ok;
  $('stage').classList.toggle('is-locked', stageLocked);
  $('playBtn').disabled = stageLocked;
  $('infoBtn').disabled = stageLocked;
  const card = $('lockCard');
  card.hidden = !stageLocked;
  if (!stageLocked) { card.innerHTML = ''; return; }
  if (audio.isPlaying()) stopPlay();
  const c = lk.chapter;
  const prevCh = prevGate(c) || c;
  card.innerHTML = `<span class="lc-ico">${icon('lock')}</span>
    <h2>Se abre en el capítulo ${c.n} · ${esc(c.title)}</h2>
    <p>${esc(opts.display)} es parte del capítulo ${c.n}. Para llegar, superá el desafío del capítulo ${prevCh.n} (<b>${esc(prevCh.title)}</b>). Si preferís ver todo, activá el modo libre.</p>
    <div class="lc-act"><a class="primary" href="#/capitulos/${prevCh.id}">Ir al capítulo ${prevCh.n}</a><button class="plain" data-libre>Desbloquear todo</button></div>`;
  card.querySelector('[data-libre]').addEventListener('click', () => setPref('libre', 'on'));
}
function lockToast(t) {
  const lk = unlockedInfo(state.kind, t);
  if (lk.ok) return false;
  toast(`Se abre al llegar al capítulo ${lk.chapter.n}: ${lk.chapter.title}.`, false, { href: `#/capitulos/${lk.chapter.id}`, label: 'Ir al capítulo' });
  return true;
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
    const ok = unlockedInfo(state.kind, t.id).ok;
    return `<button data-t="${t.id}" class="${on ? 'on' : ''}${ok ? '' : ' locked'}" aria-pressed="${on}"${ok ? '' : ' aria-disabled="true"'} title="${esc(opts.rn + ' ' + t.name)}${ok ? '' : ' (bloqueado)'}" style="--c:${prefs.tonic === 'color' ? t.color : '#1E1E1E'}">${esc(label)}</button>`;
  }).join('');
  ['variants', 'fVariants'].forEach((id) => {
    const el = $(id);
    el.innerHTML = html;
    el.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}
function pickVariant(e) {
  const b = e.target.closest('button[data-t]'); if (!b || b.dataset.t === state.type) return;
  if (lockToast(b.dataset.t)) return;
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
    state.type = (all().find((t) => unlockedInfo(state.kind, t.id).ok) || all()[0]).id;
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
    const b = e.target.closest('button[data-t]');
    if (!b) return;
    if (b.dataset.t !== state.type && !unlockedInfo(state.kind, b.dataset.t).ok) { lockToast(b.dataset.t); return; }
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
  if (openPop || stageLocked) return;
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
  if (m && !stageLocked) { if (state.focus !== Number(m[1]) - 1) openFocus(Number(m[1]) - 1, false); }
  else if (sub === 'mastil' && opts.showNeck && !stageLocked) { if (state.focus !== 'neck') openFocus('neck', false); }
  else if (state.focus !== null) { stopPlay(); closeFocus(true); }
}
export function leave() {
  stopPlay();
  closePop();
  if (state.focus !== null) closeFocus(true);
}
