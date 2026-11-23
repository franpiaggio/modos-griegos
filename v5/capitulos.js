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

let root = null;
let session = null;
let current = '';

export function mount(el) {
  root = el;
  window.addEventListener('keydown', onKey);
  onPrefs((k) => {
    if (document.body.dataset.sec !== 'capitulos') return;
    if (session) session.render(); else route(current);
    if (k === 'libre') toast(prefs.libre === 'on' ? 'Modo libre: todo desbloqueado' : 'Por capítulos: la información se desbloquea con cada desafío');
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
    <div class="cp-text"><b>${n}</b> de ${CHAPTERS.length} capítulos completados${isFree() ? ' · <span class="cp-free">Modo libre</span>' : ''}</div>
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
    <header class="t-intro"><h1>Capítulos</h1><p>El material de estudio, en orden. Cada capítulo tiene la explicación, sus escalas o arpegios en el mástil y un desafío: con ${PASS}% o más se completa y se desbloquea el siguiente.</p></header>
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

// ---------------------------------------------------------------- capítulo
function head(title, back = '#/capitulos', label = 'Capítulos') {
  return `<header class="t-head"><a class="ib" href="${back}" aria-label="Volver a ${label}">${ICON.back}</a><div class="t-title"><h1>${title}</h1></div></header>`;
}
function renderChapter(c) {
  const s = state(c);
  const items = infoItems(c);
  const t = tries(c.id);
  const prev = CHAPTERS[c.n - 2];
  const infoOk = s !== 'locked' || isFree();
  const libLink = (it) => `?k=${it.kind}&r=0&t=${it.id}#/info`;
  root.innerHTML = `<div class="t-wrap narrow cap-wrap">
    ${head(`<small class="cap-kicker">Capítulo ${c.n} de ${CHAPTERS.length}</small>${c.title}`)}
    <p class="cap-desc">${c.desc} ${stateTag(c)}</p>
    ${s === 'locked' ? `<p class="cap-lock">${icon('lock')}<span>Este capítulo se desbloquea al completar el <a href="#/capitulos/${prev.id}">capítulo ${prev.n}: ${prev.title}</a>. La teoría ya se puede leer.</span></p>` : ''}
    <section class="lbox cap-sec"><h2>${icon('teoria')} 1 · Teoría</h2><p>Leé la explicación y escuchá los ejemplos.</p>
      <div class="cap-links">${c.lessons.map((id) => `<a class="plain" href="#/teoria/${id}">${icon(id)}<span>${EXERCISES[id].title}</span></a>`).join('')}</div>
      <p class="hint-s">Para practicar sin límite, cada tema tiene su Práctica en Teoría.</p></section>
    ${items.length ? `<section class="lbox cap-sec"><h2>${icon('info')} 2 · En el mástil</h2>
      <p>${infoOk ? 'Estudialas en Información (tocá para abrir la hoja):' : `Se abren en Información al llegar a este capítulo:`}</p>
      <div class="cap-links">${items.map((it) => infoOk ? `<a class="plain" href="${libLink(it)}"><span>${esc(it.name)}</span></a>` : `<span class="plain is-locked" aria-disabled="true">${icon('lock')}<span>${esc(it.name)}</span></span>`).join('')}</div></section>` : ''}
    ${c.tecnica ? `<section class="lbox cap-sec"><h2>${icon('tecnica')} ${items.length ? 3 : 2} · Con la guitarra</h2><p>Llevalo al instrumento:</p>
      <div class="cap-links"><a class="plain" href="#/tecnica${c.tecnica[0] ? '/' + c.tecnica[0] : ''}">${icon(c.tecnica[0] || 'tecnica')}<span>${c.tecnica[1]}</span></a></div></section>` : ''}
    <section class="lbox cap-sec cap-chal"><h2>${icon('trofeo')} Desafío</h2>
      <p>10 preguntas sobre este capítulo. Con <b>${PASS}%</b> o más lo completás${c.n < CHAPTERS.length ? ' y se desbloquea el siguiente' : ''}.</p>
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
