// Enrutador de la v4: #/info[/p3|/mastil], #/teoria[/ejercicio], #/tecnica[/herramienta]
// Cada sección es un módulo con mount(el) (una vez), route(sub) (en cada cambio) y leave() (al salir).
import { $, prefs, setPref } from './ui.js';
import { icon } from './icons.js';
import * as motion from './motion.js';

document.querySelectorAll('.tabs [data-ico]').forEach((i) => (i.outerHTML = icon(i.dataset.ico)));
let firstRoute = true;
// el navegador solo permite crear el audio después de un gesto: ahí se cargan las muestras de guitarra
import('./audio.js').then((a) => a.setInstrument(prefs.sound));
window.addEventListener('pointerdown', () => import('./audio.js').then((a) => a.preload()), { once: true });
window.addEventListener('keydown', () => import('./audio.js').then((a) => a.preload()), { once: true });

const SECTIONS = {
  info: () => import('./lib.js'),
  teoria: () => import('./teoria.js'),
  tecnica: () => import('./tecnica.js'),
};
const loaded = {};
let current = null;

function parse() {
  const m = location.hash.match(/^#\/(info|teoria|tecnica)(?:\/([^?]*))?/);
  // compatibilidad con los enlaces de la v3 (#p3, #mastil)
  const legacy = location.hash.match(/^#(p\d|mastil)$/);
  if (legacy) return { sec: 'info', sub: legacy[1] };
  return m ? { sec: m[1], sub: decodeURIComponent(m[2] || '') } : { sec: 'info', sub: '' };
}

// popstate y hashchange llegan juntos al volver atrás: se procesa una sola vez
let lastHash = null;
let lastT = 0;
async function route() {
  if (location.hash === lastHash && performance.now() - lastT < 120) return;
  lastHash = location.hash;
  lastT = performance.now();
  const { sec, sub } = parse();
  if (current && current !== sec) loaded[current]?.leave?.();
  document.body.dataset.sec = sec;
  document.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== `v-${sec}`));
  document.querySelectorAll('.tabs a').forEach((a) => {
    const on = a.dataset.sec === sec;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (!loaded[sec]) {
    loaded[sec] = await SECTIONS[sec]();
    loaded[sec].mount?.($(`v-${sec}`));
  }
  const changed = current !== sec;
  if (changed) window.scrollTo(0, 0);
  current = sec;
  const prevHtml = $(`v-${sec}`).firstElementChild;
  loaded[sec].route?.(sub);
  motion.moveIndicator(document.querySelector('.tab-ind'), document.querySelector('.tabs a.on'), firstRoute);
  firstRoute = false;
  // anima la entrada cuando cambia la sección o la pantalla dentro de la sección (no al abrir una posición)
  if (sec !== 'info' && (changed || $(`v-${sec}`).firstElementChild !== prevHtml)) motion.enter($(`v-${sec}`));
  else if (changed) motion.enter($('v-info'));
}
window.addEventListener('hashchange', route);
window.addEventListener('resize', () => motion.moveIndicator(document.querySelector('.tab-ind'), document.querySelector('.tabs a.on'), true));
window.addEventListener('popstate', () => setTimeout(route));

// ---------- configuración global ----------
let open = false;
function renderSettings() {
  document.querySelectorAll('#settings .seg[data-set]').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', prefs[seg.dataset.set] === b.dataset.v));
  });
}
function toggleSettings(show = !open) {
  open = show;
  $('settings').hidden = !show;
  $('scrim').hidden = !show;
  $('setBtn').setAttribute('aria-expanded', show);
  if (show) $('settings').querySelector('button.on, button')?.focus({ preventScroll: true });
}
$('setBtn').addEventListener('click', () => toggleSettings());
$('scrim').addEventListener('click', () => open && toggleSettings(false));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { e.stopImmediatePropagation(); toggleSettings(false); $('setBtn').focus(); } }, true);
$('settings').addEventListener('click', (e) => {
  const b = e.target.closest('.seg[data-set] button'); if (!b) return;
  setPref(b.closest('.seg').dataset.set, b.dataset.v);
  if (b.closest('.seg').dataset.set === 'sound') import('./audio.js').then((a) => { a.setInstrument(b.dataset.v); a.preload().then(() => a.playChord([40, 47, 52, 56, 59, 64])); });
  renderSettings();
});
renderSettings();
if (!location.hash) history.replaceState(null, '', location.pathname + location.search + '#/info');
route();
