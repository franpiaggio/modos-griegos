// Sección "Capítulos": la ruta de estudio. Inicio con el progreso y los logros; cada capítulo reúne
// su teoría, la información que desbloquea, una sugerencia de técnica y el desafío.
import { esc, ICON, toast, onPrefs, prefs } from './ui.js';
import { icon } from './icons.js';
import { Session } from './teoria-engine.js';
import { EXERCISES } from './teoria-gen.js';
import {
  CHAPTERS, chapterById, isUnlocked, isChapterDone, chapterResult, doneCount, nextChapter, infoItems, LOGROS, earned,
  recordChallenge, tries, PASS, isFree,
} from './logros.js';
import * as motion from './motion.js';
import { note, noteName, transpose, spellAll, scaleById, chordById, ivSemis, intervalBetween } from './theory.js';
import { steps, clock, stack, ruler, fifths, roleLegend, roleOf, ROLE, FN_COLOR } from './viz.js';

let root = null;
let session = null;
let current = '';

export function mount(el) {
  root = el;
  window.addEventListener('keydown', onKey);
  onPrefs((k) => {
    if (document.body.dataset.sec !== 'capitulos') return;
    if (session) session.render(); else route(current);
    if (k === 'libre') toast(prefs.libre === 'on' ? 'Todos los capítulos abiertos' : 'Capítulos en orden: cada desafío abre el siguiente');
  });
}
export function leave() { session = null; }

export function route(sub) {
  current = sub || '';
  session = null;
  const [id, mode] = current.split('/');
  const c = chapterById(id);
  if (!c) return renderHome();
  if (mode === 'desafio' && isUnlocked(c.id)) return renderChallenge(c);
  return renderChapter(c);
}

// ---------------------------------------------------------------- piezas
const state = (c) => (isChapterDone(c.id) ? 'done' : isUnlocked(c.id) ? 'open' : 'locked');
const STATE_TXT = { done: 'Completado', open: 'Disponible', locked: 'Bloqueado' };
function stateTag(c) {
  const s = state(c);
  const r = chapterResult(c.id);
  const ic = s === 'done' ? icon('check') : s === 'locked' ? icon('lock') : '';
  return `<span class="cap-state ${s}">${ic}<span class="st-t">${STATE_TXT[s]}${s === 'done' && r ? ` · ${r.best}%` : ''}</span></span>`;
}
function progressHtml() {
  const n = doneCount();
  return `<div class="cap-progress">
    <div class="cp-text"><b>${n}</b> de ${CHAPTERS.length} capítulos completados${isFree() ? ' · <span class="cp-free">Todos abiertos</span>' : ''}</div>
    <div class="cp-bar" role="progressbar" aria-label="Capítulos completados" aria-valuemin="0" aria-valuemax="${CHAPTERS.length}" aria-valuenow="${n}"><span style="transform:scaleX(${n / CHAPTERS.length})"></span></div>
  </div>`;
}
function logrosHtml() {
  const got = earned();
  const n = LOGROS.filter((l) => got[l.id]).length;
  return `<section class="cap-logros" aria-labelledby="logrosH">
    <h2 id="logrosH">Logros <small>${n} de ${LOGROS.length}</small></h2>
    <ul>${LOGROS.map((l) => `<li class="${got[l.id] ? 'got' : ''}" title="${esc(l.desc)}"><span class="lg-ico">${icon(got[l.id] ? 'trofeo' : 'lock')}</span><span><b>${l.title}</b><small>${l.desc}</small></span><span class="sr">${got[l.id] ? 'Conseguido' : 'Pendiente'}</span></li>`).join('')}</ul>
  </section>`;
}

// ---------------------------------------------------------------- inicio
function renderHome() {
  const next = nextChapter();
  root.innerHTML = `<div class="t-wrap cap-wrap">
    <header class="t-intro"><h1>Capítulos</h1><p>Tu recorrido en orden: estudiá cada capítulo y superá su desafío para abrir el siguiente.</p></header>
    ${progressHtml()}
    ${next ? `<a class="cap-next" href="#/capitulos/${next.id}"><span class="cn-n">${next.n}</span><span class="cn-t"><small>${doneCount() ? 'Seguí con' : 'Empezá por'}</small><b>${next.title}</b></span>${ICON.next}</a>` : '<p class="cap-all">Completaste todos los capítulos.</p>'}
    <ol class="cap-path">${CHAPTERS.map((c) => {
      const s = state(c);
      return `<li class="cp-item ${s}"><a href="#/capitulos/${c.id}" ${s === 'locked' ? `aria-describedby="lk${c.n}"` : ''}>
        <span class="cp-n" aria-hidden="true">${s === 'done' ? icon('check') : c.n}</span>
        <span class="cp-body"><b><span class="sr">Capítulo ${c.n}: </span>${c.title}</b><small>${c.desc}</small></span>
        ${stateTag(c)}${s === 'locked' ? `<span class="sr" id="lk${c.n}">Se desbloquea al completar el capítulo ${c.n - 1}</span>` : ''}
      </a></li>`;
    }).join('')}</ol>
    ${logrosHtml()}
  </div>`;
}


// ---------------------------------------------------------------- gráfico de cada capítulo
const nn = (n) => noteName(n, prefs.notation);
const C = note(0), A = note(5);
const fig = (svg, cap, cls = '') => `<figure class="${cls}">${svg}<figcaption>${cap}</figcaption></figure>`;
function scaleSteps(root, id, mark = [], label = '') {
  const sc = scaleById(id);
  const names = spellAll(root, sc.intervals).map(nn);
  return steps([...names, names[0]], sc.intervals, { label: label || `${nn(root)} ${sc.name}`, mark: new Set(mark) });
}
function chordStack(root, id) {
  const ch = chordById(id);
  const ns = spellAll(root, ch.intervals);
  return stack(ch.intervals.map((iv, i) => ({ name: nn(ns[i]), iv })), ns.slice(1).map((x, i) => intervalBetween(ns[i], x).id), { label: `${nn(root)}${ch.sym} por terceras` });
}
// clock de una escala con colores por rol respecto del acorde (tensiones en violeta)
function roleClock(root, ivs, chordIvs, label) {
  const ns = spellAll(root, ivs).map(nn);
  const inChord = new Set(chordIvs.map(ivSemis));
  return clock(ivs.map((iv, i) => ({ k: ivSemis(iv), name: ns[i], iv, color: inChord.has(ivSemis(iv)) ? ROLE[roleOf(iv)] : ROLE.t })), { label, size: 210 });
}
const KEYS = [[0, 0], [4, 0], [1, 0], [5, 0], [2, 0], [6, 0], [3, 1], [1, -1], [5, -1], [2, -1], [6, -1], [3, 0]].map(([l, a]) => note(l, a));
function circle(opts) {
  const names = KEYS.map(nn);
  const minors = KEYS.map((k) => nn(transpose(k, '6')) + 'm');
  return fifths(names, minors, opts);
}
function heroHtml(c) {
  const G = note(4), D = note(1);
  switch (c.id) {
    case 'intervalos': {
      const ls = [note(6), C, D, note(2), note(3, 1)];
      return fig(ruler(ls.map(nn), 7, { label: 'De Si a Fa#: quinta justa', name: 'quinta justa' }), `${nn(ls[0])} → ${nn(ls[4])}: <b>5 notas</b> (distancia) y <b>7 semitonos</b> (género)`, 'wide');
    }
    case 'escalas':
      return fig(scaleSteps(C, 'jonico'), `${nn(C)} mayor: T T st T T T st`, 'wide') + fig(scaleSteps(A, 'eolico'), `${nn(A)} menor: T st T T st T T`, 'wide');
    case 'modos': {
      const dor = scaleById('dorico');
      const ns = spellAll(D, dor.intervals).map(nn);
      return fig(clock(dor.intervals.map((iv, i) => ({ k: ivSemis(iv), name: ns[i], iv, color: i === 0 ? ROLE[1] : iv === '6' ? ROLE[3] : '#8a8a93' })), { label: `${nn(D)} dórico`, size: 210 }), `${nn(D)} dórico: las notas de ${nn(C)} mayor desde ${nn(D)}. Lo distingue el <b>6</b>`, 'sm');
    }
    case 'pentatonicas':
      return fig(scaleSteps(A, 'penta-menor'), `${nn(A)} pentatónica menor: sin semitonos`, 'wide') + fig(scaleSteps(A, 'blues', [3]), `Escala de blues: suma la <b>b5</b> (blue note)`, 'wide');
    case 'triadas':
      return fig(chordStack(C, 'mayor'), `${nn(C)}: 3M + 3m`, 'sm') + fig(chordStack(C, 'menor'), `${nn(C)}m: 3m + 3M`, 'sm');
    case 'septimas':
      return fig(chordStack(C, 'maj7'), `${nn(C)}maj7: tríada mayor + 7`, 'sm') + fig(chordStack(G, '7'), `${nn(G)}7: tríada mayor + b7`, 'sm');
    case 'armonica':
      return fig(scaleSteps(A, 'menor-armonica', [6]), `${nn(A)} menor armónica: la <b>7</b> sube un semitono (T+st entre b6 y 7)`, 'wide');
    case 'melodica':
      return fig(scaleSteps(A, 'menor-melodica', [2]), `${nn(A)} menor melódica: una escala mayor con la <b>b3</b>`, 'wide');
    case 'funciones':
      return fig(circle({ label: 'Funciones en Do mayor', marks: [{ pos: 0, color: FN_COLOR.Tónica }, { pos: 11, color: FN_COLOR.Subdominante }, { pos: 1, color: FN_COLOR.Dominante }, { pos: 0, ring: 'in', color: FN_COLOR.Tónica }, { pos: 11, ring: 'in', color: FN_COLOR.Subdominante }, { pos: 1, ring: 'in', color: FN_COLOR.Tónica }] }), `<span class="fn-key">${Object.entries(FN_COLOR).map(([k, col]) => `<span><i style="background:${col}"></i>${k}</span>`).join('')}</span>`, 'sm');
    case 'secundarios':
      return fig(circle({ label: 'Cadena de dominantes hacia Do', marks: [{ pos: 0, color: ROLE[1] }, { pos: 1, color: FN_COLOR.Dominante }, { pos: 2, color: ROLE[3] }, { pos: 3, color: ROLE[3] }], arrows: [[1, 0, FN_COLOR.Dominante], [2, 1, ROLE[3]], [3, 2, ROLE[3]]] }), `Cada V7 cae una 5ta: ${nn(note(5))}7 → ${nn(D)}7 → ${nn(G)}7 → ${nn(C)}`, 'sm');
    case 'intercambio':
      return fig(scaleSteps(C, 'jonico'), `${nn(C)} mayor`, 'wide') + fig(scaleSteps(C, 'eolico', [2, 5, 6]), `${nn(C)} menor presta la <b>b3, b6 y b7</b>`, 'wide');
    case 'tritono': {
      const ivs = ['1', '3', '5', 'b7'];
      const ns = spellAll(G, ivs).map(nn);
      const items = ivs.map((iv, i) => ({ k: ivSemis(iv), name: ns[i], iv, color: ROLE[roleOf(iv)] }));
      items.push({ k: 6, name: nn(note(1, -1)), iv: 'b5', color: ROLE.t });
      return fig(clock(items, { label: 'Sol7 y su sustituto tritonal', pairs: [[4, 10, ROLE.t], [0, 6, '#9a9aa3']], polygon: false, size: 210 }), `${nn(G)}7 y ${nn(note(1, -1))}7 comparten el tritono ${ns[1]}–${ns[3]}`, 'sm');
    }
    case 'impro': {
      const mix = scaleById('mixolidio').intervals;
      return fig(roleClock(G, mix, chordById('7').intervals, `${nn(G)} mixolidio sobre ${nn(G)}7`), `Sobre ${nn(G)}7: notas del acorde para apoyar, tensiones de color`, 'sm') + roleLegend([1, 3, 5, 7, 't']);
    }
    default: return '';
  }
}

// ---------------------------------------------------------------- capítulo
function head(title, back = '#/capitulos', label = 'Capítulos') {
  return `<header class="t-head"><a class="ib" href="${back}" aria-label="Volver a ${label}">${ICON.back}</a><div class="t-title"><h1>${title}</h1></div></header>`;
}
function renderChapter(c) {
  const s = state(c);
  const items = infoItems(c);
  const t = tries(c.id);
  const prev = CHAPTERS[c.n - 2];
  const infoOk = true; // Información siempre libre
  const libLink = (it) => `?k=${it.kind}&r=0&t=${it.id}#/info`;
  root.innerHTML = `<div class="t-wrap narrow cap-wrap">
    ${head(`<small class="cap-kicker">Capítulo ${c.n} de ${CHAPTERS.length}</small>${c.title}`)}
    <p class="cap-desc">${c.desc} ${stateTag(c)}</p>
    ${s === 'locked' ? `<p class="cap-lock">${icon('lock')}<span>Este capítulo se desbloquea al completar el <a href="#/capitulos/${prev.id}">capítulo ${prev.n}: ${prev.title}</a>. Igual podés estudiarlo.</span></p>` : ''}
    <div class="viz-row cap-hero">${heroHtml(c)}</div>
    <section class="lbox cap-sec"><h2>${icon('teoria')} 1 · Teoría</h2>
      <div class="cap-links">${c.lessons.map((id) => `<a class="plain" href="#/teoria/${id}">${icon(id)}<span>${EXERCISES[id].title}</span></a>`).join('')}</div></section>
    ${items.length ? `<section class="lbox cap-sec"><h2>${icon('info')} 2 · En el mástil</h2>
      <div class="cap-links">${items.map((it) => infoOk ? `<a class="plain" href="${libLink(it)}"><span>${esc(it.name)}</span></a>` : `<span class="plain is-locked" aria-disabled="true">${icon('lock')}<span>${esc(it.name)}</span></span>`).join('')}</div></section>` : ''}
    ${c.tecnica ? `<section class="lbox cap-sec"><h2>${icon('tecnica')} ${items.length ? 3 : 2} · Con la guitarra</h2>
      <div class="cap-links"><a class="plain" href="#/tecnica${c.tecnica[0] ? '/' + c.tecnica[0] : ''}">${icon(c.tecnica[0] || 'tecnica')}<span>${c.tecnica[1]}</span></a></div></section>` : ''}
    <section class="lbox cap-sec cap-chal"><h2>${icon('trofeo')} Desafío</h2>
      <p>10 preguntas. Con <b>${PASS}%</b> lo completás${c.n < CHAPTERS.length ? ' y se abre el siguiente' : ''}.</p>
      ${t ? `<p class="hint-s">Mejor resultado: <b>${t.best}%</b> · intentos: ${t.n}</p>` : ''}
      ${s === 'locked' ? `<button class="primary" disabled>${icon('lock')}<span>Bloqueado</span></button>` : `<a class="primary" href="#/capitulos/${c.id}/desafio">${s === 'done' ? 'Repetir desafío' : 'Empezar desafío'} ${ICON.next}</a>`}
    </section>
    ${chapterNav(c)}
  </div>`;
}
function chapterNav(c) {
  const p = CHAPTERS[c.n - 2];
  const n = CHAPTERS[c.n];
  return `<nav class="cap-nav" aria-label="Otros capítulos">${p ? `<a class="plain" href="#/capitulos/${p.id}">${ICON.back}<span>${p.n} · ${p.title}</span></a>` : '<span></span>'}${n ? `<a class="plain" href="#/capitulos/${n.id}"><span>${n.n} · ${n.title}</span>${ICON.next}</a>` : ''}</nav>`;
}

// ---------------------------------------------------------------- desafío
function mixGen(c) {
  const gens = c.challenge.map(([id, cfg]) => EXERCISES[id].make({ ...EXERCISES[id].defaults, ...cfg }));
  return () => gens[Math.floor(Math.random() * gens.length)]();
}
function renderChallenge(c) {
  root.innerHTML = `<div class="t-wrap narrow cap-wrap">${head(`<small class="cap-kicker">Desafío · capítulo ${c.n}</small>${c.title}`, `#/capitulos/${c.id}`, c.title)}<div class="q-area"></div></div>`;
  session = new Session(root.querySelector('.q-area'), {
    id: 'cap-' + c.id, title: c.title, gen: mixGen(c), count: 10, exitLabel: 'Volver al capítulo',
    onExit: () => { location.hash = `#/capitulos/${c.id}`; },
    onFinish: (pct, s) => resultHtml(c, recordChallenge(c.id, pct, s.bestStreak)),
  });
  session.afterSummary = (el) => celebrate(el);
}
function resultHtml(c, r) {
  const out = [];
  if (r.passed) {
    out.push(`<div class="cap-res ok">${icon('check')}<div><b>${r.firstPass ? `¡Capítulo ${c.n} completado!` : 'Desafío superado.'}</b>${r.unlocked ? `<span>Se desbloqueó el <a href="#/capitulos/${r.unlocked.id}">capítulo ${r.unlocked.n}: ${r.unlocked.title}</a>.</span>` : ''}${r.firstPass && infoItems(c).length ? `<span>Nuevo en Información: ${infoItems(c).map((i) => esc(i.name)).join(', ')}.</span>` : ''}</div></div>`);
  } else {
    out.push(`<div class="cap-res">${icon('lock')}<div><b>Te falta poco: necesitás ${PASS}%.</b><span>Repasá la <a href="#/teoria/${c.lessons[0]}">teoría</a> o practicá en <a href="#/teoria/${c.lessons[0]}/practica">${EXERCISES[c.lessons[0]].title}</a> y volvé a intentarlo.</span></div></div>`);
  }
  if (r.newLogros.length) {
    out.push(`<ul class="cap-new">${r.newLogros.map((l) => `<li>${icon('trofeo')}<span><b>Logro: ${l.title}</b><small>${l.desc}</small></span></li>`).join('')}</ul>`);
    setTimeout(() => toast(`Nuevo logro: ${r.newLogros.map((l) => l.title).join(', ')}`), 600);
  }
  return out.join('');
}
// Celebración sutil: el resultado y los logros entran con un pequeño rebote
function celebrate(el) {
  const gs = !matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap;
  if (!gs) return;
  const items = el.querySelectorAll('.cap-res.ok, .cap-new li');
  if (!items.length) return;
  gs.fromTo(items, { autoAlpha: 0, y: 10, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.12, delay: 0.35, clearProps: 'transform,opacity,visibility' });
  const ic = el.querySelectorAll('.cap-res.ok .ico, .cap-new .ico');
  gs.fromTo(ic, { rotate: -12, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)', stagger: 0.12, delay: 0.45, clearProps: 'transform' });
}

// ---------------------------------------------------------------- teclado
function onKey(e) {
  if (document.body.dataset.sec !== 'capitulos' || !session) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (!document.getElementById('settings').hidden) return;
  if (e.key === 'Enter' && e.target.closest?.('button, a') && !e.target.matches('[data-next], [data-again]')) return;
  session.key(e);
}

// Para pruebas automáticas
export const _session = () => session;
