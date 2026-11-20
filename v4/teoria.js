// Sección "Ejercitación teórica": inicio con tarjetas, ejercicios con sesión de preguntas y explorador de improvisación.
import { notePc, transpose, spellAll, scaleById, pentatonicsIn, superimpositions, ivSemis, toExt, LETTERS, note } from './theory.js';
import { prefs, onPrefs, store, esc, ICON } from './ui.js';
import { icon } from './icons.js';
import * as audio from './audio.js';
import { Session, settingsHtml, bindSettings, stats, N, NL } from './teoria-engine.js';
import { EXERCISES, GROUPS, CH, contexts, tensionsOf, midisOf, scaleLabel } from './teoria-gen.js';
import { lessonHtml } from './teoria-lessons.js';
import * as motion from './motion.js';

let root = null;
let session = null;
let current = '';
let explorer = null;

const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
const GROUP_INFO = {
  Construcción: 'Escribir intervalos, escalas y acordes con la letra correcta.',
  Análisis: 'Reconocer grados y escalas, leyendo y de oído.',
  Armonía: 'Funciones, tensiones, dominantes secundarios, subV7 e intercambio modal.',
  Improvisación: 'Qué tocar sobre cada acorde.',
};

export function mount(el) {
  root = el;
  window.addEventListener('keydown', onKey);
  onPrefs(() => { if (document.body.dataset.sec !== 'teoria') return; if (session && current !== 'impro-x') session.render(); else route(current); });
}
export function leave() { session = null; }

export function route(sub) {
  current = sub || '';
  session = null;
  if (!sub) return renderHome();
  if (sub === 'impro-quiz') sub = 'impro/practica';
  const [id, mode = ''] = sub.split('/');
  if (!EXERCISES[id]) return renderHome();
  if (id === 'impro' && mode === 'explorar') return renderImpro('explorar');
  if (id === 'impro' && mode === 'practica') return renderImpro('quiz');
  if (mode === 'practica') return renderExercise(id);
  return renderLesson(id);
}

// ---------------------------------------------------------------- inicio
function badge(id) {
  const s = stats(id);
  if (!s) return '<span class="badge new">Nuevo</span>';
  return `<span class="badge">Último ${s.last}% · mejor ${s.best}%</span>`;
}
function renderHome() {
  root.innerHTML = `<div class="t-wrap">
    <header class="t-intro"><small class="eyebrow">Teoría · explicación + práctica</small><h1>Ejercitación teórica</h1><p>Cada tema tiene dos partes:</p><div class="two-parts"><span>${BOOK}<b>Teoría</b> la explicación, con tablas y ejemplos para escuchar</span><span>${PENCIL}<b>Práctica</b> sesiones de 10 preguntas con corrección inmediata</span></div></header>
    ${GROUPS.map((g) => `<section class="t-group"><h2>${g}</h2><p class="g-info">${GROUP_INFO[g]}</p><div class="cards">
      ${Object.entries(EXERCISES).filter(([, e]) => e.group === g).map(([id, e]) => `<a class="card" href="#/teoria/${id}"><span class="card-ico">${icon(id)}</span><b>${e.title}</b><span>${e.desc}</span><span class="parts"><span>${BOOK}Teoría</span><span>${PENCIL}${id === 'impro' ? 'Explorador · Práctica' : 'Práctica'}</span></span>${id === 'impro' ? '' : badge(id)}</a>`).join('')}
    </div></section>`).join('')}
  </div>`;
}

// ---------------------------------------------------------------- ejercicio
function cfgOf(id) {
  const ex = EXERCISES[id];
  const saved = store.get(`teoria.cfg.${id}`, {});
  const cfg = { ...ex.defaults, count: 10 };
  Object.keys(saved).forEach((k) => {
    const g = ex.settings.find((x) => x.key === k);
    if (k === 'count') cfg.count = saved.count === 20 ? 20 : 10;
    else if (g) {
      const valid = g.options.map((o) => o[0]);
      if (g.multi && Array.isArray(saved[k]) && saved[k].some((v) => valid.includes(v))) cfg[k] = saved[k].filter((v) => valid.includes(v));
      else if (!g.multi && valid.includes(saved[k])) cfg[k] = saved[k];
    }
  });
  return cfg;
}
const COUNT_GROUP = { key: 'count', label: 'Preguntas por sesión', options: [[10, '10'], [20, '20']] };

const BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 10.5h6"/></svg>';
const PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1L19 8.5 15.5 5 5 15.5zM13.5 7l3.5 3.5"/></svg>';
const COMPASS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>';
// Cada tema tiene dos partes bien separadas: la explicación (Teoría) y los ejercicios (Práctica).
function modeTabs(id, active) {
  const tabs = [['', 'Teoría', BOOK, 'Explicación con tablas y ejemplos']];
  if (id === 'impro') tabs.push(['explorar', 'Explorador', COMPASS, 'Qué tocar sobre cada acorde']);
  tabs.push(['practica', 'Práctica', PENCIL, 'Preguntas con corrección']);
  return `<nav class="mode-tabs" aria-label="Teoría o práctica">${tabs.map(([m, t, ic, d]) => `<a href="#/teoria/${id}${m ? '/' + m : ''}" class="${m === active ? 'on' : ''}" ${m === active ? 'aria-current="page"' : ''} title="${d}">${ic}<span>${t}</span></a>`).join('')}</nav>`;
}
function renderLesson(id) {
  const ex = EXERCISES[id];
  root.innerHTML = `<div class="t-wrap narrow">${head(id, ex.title, ex.group)}${modeTabs(id, '')}
    ${lessonHtml(id)}
    <div class="lesson-cta"><span>¿Listo? Practicá lo que acabás de leer.</span><a class="primary" href="#/teoria/${id}/${id === 'impro' ? 'explorar' : 'practica'}">${id === 'impro' ? 'Ir al explorador' : 'Ir a la práctica'} ${ICON.next}</a></div></div>`;
  root.querySelector('[data-cfg]').hidden = true;
  root.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
    const m = b.dataset.play.split(',').map(Number);
    if (b.dataset.mode === 'chord') audio.playChord(m); else audio.playSeq(m, { step: 0.38 });
  }));
  root.querySelector('[data-cad]')?.addEventListener('click', () => audio.playSeq([[48, 52, 55, 60], [53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 60]], { step: 0.9, dur: 0.8 }));
}
function head(id, title, group, extra = '') {
  return `<header class="t-head">
    <a class="ib" href="#/teoria" aria-label="Volver a Teoría">${ICON.back}</a>
    <div class="t-title"><small>${group}</small><h1>${title}</h1></div>
    ${extra}
    <button class="ib" data-cfg aria-expanded="false" aria-label="Opciones del ejercicio" title="Opciones">${GEAR}</button>
  </header>`;
}

function renderExercise(id, area = null, quizOnly = false) {
  const ex = EXERCISES[id];
  const cfg = cfgOf(id);
  const groups = [...ex.settings, COUNT_GROUP];
  const host = area || root;
  if (!area) {
    host.innerHTML = `<div class="t-wrap narrow">${head(id, ex.title, ex.group)}${modeTabs(id, 'practica')}<div class="cfg-panel" hidden></div><div class="q-area"></div></div>`;
  }
  const panel = host.querySelector('.cfg-panel');
  const qa = host.querySelector('.q-area');
  const start = () => {
    session = new Session(qa, { id, title: ex.title, gen: ex.make(cfg), count: cfg.count, onExit: () => { location.hash = '#/teoria'; } });
  };
  const drawPanel = () => {
    panel.innerHTML = `${settingsHtml(groups, cfg)}<div class="cfg-act"><span class="hint-s">Los cambios reinician la sesión.</span><button class="primary" data-apply>Empezar</button></div>`;
    bindSettings(panel, groups, cfg, () => { store.set(`teoria.cfg.${id}`, cfg); drawPanel(); });
    panel.querySelector('[data-apply]').addEventListener('click', () => { togglePanel(false); start(); });
  };
  const btn = host.querySelector('[data-cfg]');
  const togglePanel = (show = panel.hidden) => {
    panel.hidden = !show;
    btn.setAttribute('aria-expanded', show);
    if (show) drawPanel();
  };
  btn.onclick = () => togglePanel();
  start();
  return quizOnly;
}

// ---------------------------------------------------------------- improvisación
const IMPRO_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].map((s) => note(LETTERS.indexOf(s[0]), s[1] === 'b' ? -1 : s[1] === '#' ? 1 : 0));
const libLink = (kind, pc, id) => `?k=${kind}&r=${pc}&t=${id}#/info`;

function renderImpro(tab) {
  root.innerHTML = `<div class="t-wrap">${head('impro', 'Improvisación', 'Improvisación')}${modeTabs('impro', tab === 'quiz' ? 'practica' : 'explorar')}
    <div class="cfg-panel" hidden></div><div class="q-area"></div></div>`;
  const cfgBtn = root.querySelector('[data-cfg]');
  if (tab === 'quiz') { current = 'impro-quiz'; return renderExercise('impro', root); }
  cfgBtn.hidden = true;
  session = null;
  current = 'impro';
  explorer ||= { key: 0, ctx: 'd4' };
  drawExplorer(root.querySelector('.q-area'));
}

function drawExplorer(el) {
  const k = IMPRO_KEYS[explorer.key];
  const ctxs = contexts(k);
  const c = ctxs.find((x) => x.id === explorer.ctx) || ctxs[0];
  const main = scaleById(c.scale);
  const pc = notePc(c.root);
  const { tensions, avoid } = c.tensions ? c : tensionsOf(c.chord, main);
  const chordNotes = spellAll(c.root, c.chord.intervals);
  const mainNotes = spellAll(c.root, main.intervals);
  // etiqueta de cada altura respecto del acorde (1 3 5 7 o tensión 9 11 13)
  const labelOf = new Map(main.intervals.map((iv) => [(pc + ivSemis(iv)) % 12, c.chord.intervals.some((x) => ivSemis(x) === ivSemis(iv)) ? iv : toExt(iv)]));
  const avoidSet = new Set(avoid.map((a) => a.split(' ')[0]));
  const pentas = main.intervals.length === 7 ? pentatonicsIn(pc, main.intervals) : [];
  const sups = main.intervals.length === 7 ? superimpositions(pc, main.intervals).filter((s) => s.deg > 0) : [];
  const groups = [...new Set(ctxs.map((x) => x.group))];
  const scaleRow = (s, isMain) => {
    const notes = spellAll(c.root, s.intervals);
    const diff = isMain ? '' : s.intervals.filter((iv) => !main.intervals.some((m) => ivSemis(m) === ivSemis(iv))).map(toExt);
    const inLib = !!s.fam;
    return `<li><div><b>${N(c.root)} ${s.name}</b><small>${NL(notes)}</small>${isMain ? `<small>Fórmula: ${s.intervals.join(' ')}</small>` : diff.length ? `<small>Cambia: ${diff.join(', ')}</small>` : ''}</div>
      <span class="row-act"><button class="ib sm" data-play="${s.id}" aria-label="Escuchar">${ICON.sound}</button>${inLib ? `<a class="plain sm" href="${libLink('escala', pc, s.id)}">Ver en el mástil</a>` : ''}</span></li>`;
  };
  el.innerHTML = `<div class="ex-pick">
      <label class="ex-key">Tonalidad <select data-key>${IMPRO_KEYS.map((n, i) => `<option value="${i}" ${i === explorer.key ? 'selected' : ''}>${N(n)} mayor</option>`).join('')}</select></label>
      ${groups.map((g) => `<div class="ex-g"><span>${g}</span><div class="chips">${ctxs.filter((x) => x.group === g).map((x) => `<button data-ctx="${x.id}" class="${x.id === c.id ? 'on' : ''}" aria-pressed="${x.id === c.id}"><b>${esc(x.label)}</b> ${esc(CH(x.root, x.chord))}</button>`).join('')}</div></div>`).join('')}
    </div>
    <article class="ex-card">
      <header class="ex-chord"><div><b>${esc(CH(c.root, c.chord))}</b><span>${esc(c.label)} · ${esc(c.fn)}</span></div><button class="ib" data-chord aria-label="Escuchar acorde">${ICON.sound}</button></header>
      <p class="ex-notes">${chordNotes.map((n, i) => `<span>${N(n)}<small>${c.chord.intervals[i]}</small></span>`).join('')}</p>
      <h3>Escala principal</h3><ul class="ex-list">${scaleRow(main, true)}</ul>
      <div class="ex-tags"><span>Tensiones: <b>${tensions.join(', ') || '—'}</b></span><span>A evitar: <b>${avoid.join(', ') || 'ninguna'}</b></span></div>
      ${c.note ? `<p class="ex-note">${esc(c.note)}</p>` : ''}
      ${c.alt.length ? `<h3>Alternativas</h3><ul class="ex-list">${c.alt.map((id) => scaleRow(scaleById(id), false)).join('')}</ul>` : ''}
      ${pentas.length ? `<h3>Pentatónicas que entran en la escala</h3><ul class="ex-list">${pentas.map((p) => {
        const mr = mainNotes.find((n) => notePc(n) === p.majorPc);
        const mi = transpose(mr, '6');
        const labs = ['1', '2', '3', '5', '6'].map((iv) => labelOf.get((p.majorPc + ivSemis(iv)) % 12));
        return `<li><div><b>${N(mr)} pentatónica mayor</b><small>= ${N(mi)} pentatónica menor · sobre ${esc(CH(c.root, c.chord))}: ${labs.join(' ')}</small></div>
          <span class="row-act"><a class="plain sm" href="${libLink('escala', p.majorPc, 'penta-mayor')}">Ver en el mástil</a></span></li>`;
      }).join('')}</ul>` : ''}
      ${sups.length ? `<h3>Arpegios superpuestos</h3><ul class="ex-list">${sups.map((s) => {
        const r = transpose(c.root, main.intervals[s.deg]);
        const bad = s.tones.filter((t) => avoidSet.has(t));
        return `<li class="${bad.length ? 'warn' : ''}"><div><b>${esc(CH(r, s.chord))}</b><small>Aporta ${s.tones.join(' ')}${bad.length ? ` · incluye ${bad.join(', ')} (a evitar)` : ''}</small></div>
          <span class="row-act"><a class="plain sm" href="${libLink('arpegio', notePc(r), s.chord.id)}">Ver en el mástil</a></span></li>`;
      }).join('')}</ul>` : ''}
    </article>`;
  el.querySelector('[data-key]').addEventListener('change', (e) => { explorer.key = Number(e.target.value); drawExplorer(el); });
  el.querySelectorAll('[data-ctx]').forEach((b) => b.addEventListener('click', () => { explorer.ctx = b.dataset.ctx; drawExplorer(el); }));
  el.querySelector('[data-chord]').addEventListener('click', () => audio.playChord(midisOf(c.root, c.chord.intervals)));
  el.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
    const s = scaleById(b.dataset.play);
    audio.playSeq(midisOf(c.root, [...s.intervals, '8'], 55), { step: 0.24, dur: 0.35 });
  }));
}

// ---------------------------------------------------------------- teclado
function onKey(e) {
  if (document.body.dataset.sec !== 'teoria' || !session) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (!document.getElementById('settings').hidden) return;
  if (root.querySelector('.cfg-panel:not([hidden])')) return;
  if (e.key === 'Enter' && e.target.closest?.('button, a') && !e.target.matches('[data-next], [data-again]')) return;
  session.key(e);
}

// Para pruebas automáticas
export const _session = () => session;
