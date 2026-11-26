// Sección "Capítulos": la ruta de estudio. Inicio con el progreso y los logros; cada capítulo reúne
// su teoría, la información que desbloquea, una sugerencia de técnica y el desafío.
import { esc, ICON, toast, onPrefs, prefs } from './ui.js';
import { icon } from './icons.js';
import { Session } from './teoria-engine.js';
import { EXERCISES } from './teoria-gen.js';
import { SCALES, CHORDS } from './theory.js';
import {
  CHAPTERS, chapterById, isUnlocked, isChapterDone, chapterResult, doneCount, nextChapter, infoItems, LOGROS, earned,
  recordChallenge, tries, PASS, isFree, prevGate, checked, toggleTema,
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
  if (mode === 'desafio' && c.challenge && isUnlocked(c.id)) return renderChallenge(c);
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
    <header class="t-intro"><h1>Visualizar</h1><p>Curso de guitarra orientado a la visualización del diapasón. Estudiá cada capítulo en orden y superá su desafío para abrir el siguiente. Técnica queda abierta desde el inicio: practicala en paralelo.</p></header>
    ${progressHtml()}
    ${next ? `<a class="cap-next" href="#/capitulos/${next.id}"><span class="cn-n">${next.n}</span><span class="cn-t"><small>${doneCount() ? 'Seguí con' : 'Empezá por'}</small><b>${next.title}</b></span>${ICON.next}</a>` : '<p class="cap-all">Completaste todos los capítulos.</p>'}
    <ol class="cap-path">${CHAPTERS.map((c) => {
      const s = state(c);
      return `<li class="cp-item ${s}"><a href="#/capitulos/${c.id}" ${s === 'locked' ? `aria-describedby="lk${c.n}"` : ''}>
        <span class="cp-n" aria-hidden="true">${s === 'done' ? icon('check') : c.n}</span>
        <span class="cp-body"><b><span class="sr">Capítulo ${c.n}: </span>${c.title}</b><small>${c.desc}</small>${c.parallel ? '<small class="cp-par">En paralelo desde el capítulo 1</small>' : ''}</span>
        ${stateTag(c)}${s === 'locked' ? `<span class="sr" id="lk${c.n}">Se desbloquea al completar el capítulo ${prevGate(c)?.n}</span>` : ''}
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
    case 'pentatonica':
      return fig(scaleSteps(C, 'penta-mayor'), `${nn(C)} pentatónica mayor: 1 2 3 5 6, sin semitonos`, 'wide') + fig(scaleSteps(A, 'penta-menor'), `${nn(A)} pentatónica menor: las mismas notas desde la relativa`, 'wide') + fig(scaleSteps(A, 'blues', [3]), `Escala de blues: suma la <b>b5</b> (blue note)`, 'wide');
    case 'acordes':
      return fig(chordStack(C, 'mayor'), `${nn(C)}: 3M + 3m`, 'sm') + fig(chordStack(C, 'maj7'), `${nn(C)}maj7: tríada mayor + 7`, 'sm') + fig(chordStack(G, '7'), `${nn(G)}7: tríada mayor + b7`, 'sm');
    case 'tonal':
      return fig(scaleSteps(C, 'jonico', [3, 6]), `${nn(C)} mayor: la pentatónica más la <b>4</b> y la <b>7</b>`, 'wide') + fig(circle({ label: 'Funciones en Do mayor', marks: [{ pos: 0, color: FN_COLOR.Tónica }, { pos: 11, color: FN_COLOR.Subdominante }, { pos: 1, color: FN_COLOR.Dominante }, { pos: 0, ring: 'in', color: FN_COLOR.Tónica }, { pos: 11, ring: 'in', color: FN_COLOR.Subdominante }, { pos: 1, ring: 'in', color: FN_COLOR.Tónica }] }), `<span class="fn-key">${Object.entries(FN_COLOR).map(([k, col]) => `<span><i style="background:${col}"></i>${k}</span>`).join('')}</span>`, 'sm');
    case 'modos': {
      const dor = scaleById('dorico');
      const ns = spellAll(D, dor.intervals).map(nn);
      return fig(clock(dor.intervals.map((iv, i) => ({ k: ivSemis(iv), name: ns[i], iv, color: i === 0 ? ROLE[1] : iv === '6' ? ROLE[3] : '#8a8a93' })), { label: `${nn(D)} dórico`, size: 210 }), `${nn(D)} dórico: las notas de ${nn(C)} mayor desde ${nn(D)}. Lo distingue el <b>6</b>`, 'sm');
    }
    case 'extensiones': {
      const ivs = ['1', '3', '5', '7', '9'];
      const ns = spellAll(C, ivs).map(nn);
      return fig(stack(ivs.map((iv, i) => ({ name: ns[i], iv })), ns.slice(1).map((x, i) => intervalBetween(spellAll(C, ivs)[i], spellAll(C, ivs)[i + 1]).id), { label: `${nn(C)}maj9 por terceras` }), `Desde la 3ra de ${nn(C)}maj7 sale ${ns[1]}m7 (${ns.slice(1).join(' ')}): suena <b>${nn(C)}maj9</b>`, 'sm');
    }
    case 'final': {
      const mix = scaleById('mixolidio').intervals;
      return fig(roleClock(G, mix, chordById('7').intervals, `${nn(G)} mixolidio sobre ${nn(G)}7`), `Sobre cada acorde: notas del acorde para apoyar, tensiones para dar color`, 'sm') + roleLegend([1, 3, 5, 7, 't']);
    }
    default: return '';
  }
}

// ---------------------------------------------------------------- capítulo
function head(title, back = '#/capitulos', label = 'Capítulos') {
  return `<header class="t-head"><a class="ib" href="${back}" aria-label="Volver a ${label}">${ICON.back}</a><div class="t-title"><h1>${title}</h1></div></header>`;
}
// Enlace de un tema a otra sección: [teoria, id] | [escala, id] | [arpegio, id] | [tecnica, ruta, texto] | [mastil, escala, texto]
function linkHtml(l) {
  const [kind, id, label] = l;
  if (kind === 'teoria') return `<a class="tl tl-teoria" href="#/teoria/${id}">${icon('teoria')}<span>${esc(EXERCISES[id].title)}</span></a>`;
  if (kind === 'escala' || kind === 'arpegio') {
    const it = (kind === 'escala' ? SCALES : CHORDS).find((x) => x.id === id);
    return `<a class="tl tl-info" href="?k=${kind}&r=0&t=${id}#/info">${icon('info')}<span>${esc(it.name)}</span></a>`;
  }
  if (kind === 'mastil') return `<a class="tl tl-info" href="?k=escala&r=0&t=${id}#/info/mastil">${icon('info')}<span>${esc(label)}</span></a>`;
  return `<a class="tl tl-tec" href="#/tecnica/${id}">${icon('tecnica')}<span>${esc(label)}</span></a>`;
}
function temasHtml(c) {
  const ck = c.check ? checked(c.id) : null;
  return `<ol class="cap-temas">${c.temas.map((t, i) => `<li class="${ck?.has(i) ? 'is-done' : ''}">
    <span class="ct-n" aria-hidden="true">${i + 1}</span>
    <div class="ct-body">
      <h3>${esc(t.t)}</h3>${t.d ? `<p>${esc(t.d)}</p>` : ''}
      ${t.links.length ? `<div class="ct-links">${t.links.map(linkHtml).join('')}</div>` : ''}
    </div>
    ${ck ? `<label class="ct-check"><input type="checkbox" data-tema="${i}" aria-label="Hecho: ${esc(t.t)}" ${ck.has(i) ? 'checked' : ''} ${state(c) === 'locked' ? 'disabled aria-describedby="capLock"' : ''}><span>Hecho</span></label>` : ''}
  </li>`).join('')}</ol>`;
}
const countTxt = (c, n) => (n === c.temas.length ? `Completaste los ${c.temas.length} temas.` : `Marcá cada tema cuando lo tengas listo: <b>${n} de ${c.temas.length}</b>.`);
function closeHtml(c) {
  const s = state(c);
  if (c.check) {
    const n = checked(c.id).size;
    return `<section class="lbox cap-sec cap-chal"><h2>${icon('trofeo')} ${c.id === 'final' ? 'Entrega' : 'Rutina'}</h2>
      <p class="ct-count">${countTxt(c, n)}</p>
      <div class="cp-bar" role="progressbar" aria-label="Temas hechos" aria-valuemin="0" aria-valuemax="${c.temas.length}" aria-valuenow="${n}"><span style="transform:scaleX(${n / c.temas.length})"></span></div>
      <div class="ct-res" aria-live="polite"></div></section>`;
  }
  const t = tries(c.id);
  const ng = CHAPTERS.slice(c.n).find((x) => !x.parallel);
  return `<section class="lbox cap-sec cap-chal"><h2>${icon('trofeo')} Desafío</h2>
      <p>10 preguntas. Con <b>${PASS}%</b> lo completás${ng ? ' y se abre el siguiente' : ''}.</p>
      ${t ? `<p class="hint-s">Mejor resultado: <b>${t.best}%</b> · intentos: ${t.n}</p>` : ''}
      ${s === 'locked' ? `<button class="primary" disabled>${icon('lock')}<span>Bloqueado</span></button>` : `<a class="primary" href="#/capitulos/${c.id}/desafio">${s === 'done' ? 'Repetir desafío' : 'Empezar desafío'} ${ICON.next}</a>`}
    </section>`;
}
function renderChapter(c) {
  const s = state(c);
  const prev = prevGate(c);
  root.innerHTML = `<div class="t-wrap narrow cap-wrap">
    ${head(`<small class="cap-kicker">${c.id === 'final' ? 'Cierre del curso' : `Capítulo ${c.n} de ${CHAPTERS.length - 1}`}</small>${c.title}`)}
    <p class="cap-desc">${c.desc} ${stateTag(c)}</p>
    ${s === 'locked' && prev ? `<p class="cap-lock" id="capLock">${icon('lock')}<span>Se desbloquea al completar el <a href="#/capitulos/${prev.id}">capítulo ${prev.n}: ${prev.title}</a>. Igual podés estudiarlo.</span></p>` : ''}
    <div class="viz-row cap-hero">${heroHtml(c)}</div>
    <section class="cap-sec"><h2 class="ct-h">Temas</h2>${temasHtml(c)}</section>
    ${closeHtml(c)}
    ${chapterNav(c)}
  </div>`;
  // Marcar un tema actualiza solo lo necesario (sin volver a dibujar): el foco y la región viva se mantienen
  root.querySelectorAll('[data-tema]').forEach((el) => el.addEventListener('change', () => {
    const r = toggleTema(c.id, Number(el.dataset.tema), el.checked);
    el.closest('li').classList.toggle('is-done', el.checked);
    root.querySelector('.ct-count').innerHTML = countTxt(c, r.count);
    const bar = root.querySelector('.cap-chal .cp-bar');
    bar.setAttribute('aria-valuenow', r.count);
    bar.querySelector('span').style.transform = `scaleX(${r.count / c.temas.length})`;
    const tag = root.querySelector('.cap-desc .cap-state');
    if (tag) tag.outerHTML = stateTag(c);
    const box = root.querySelector('.ct-res');
    if (r.firstPass || r.unlocked || r.newLogros.length) {
      box.innerHTML = resultHtml(c, { passed: true, ...r });
      celebrate(box);
    } else if (!r.complete) box.innerHTML = '';
  }));
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
    out.push(`<div class="cap-res ok">${icon('check')}<div><b>${r.firstPass ? (doneCount() === CHAPTERS.length ? '¡Curso completo!' : c.id === 'final' ? 'Trabajo final entregado.' : `¡${c.title}: completado!`) : c.check ? 'Capítulo completo.' : 'Desafío superado.'}</b>${r.unlocked ? `<span>Se desbloqueó el <a href="#/capitulos/${r.unlocked.id}">capítulo ${r.unlocked.n}: ${r.unlocked.title}</a>.</span>` : ''}</div></div>`);
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
