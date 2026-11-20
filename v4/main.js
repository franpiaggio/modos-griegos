// Enrutador de la v4: #/info[/p3|/mastil], #/teoria[/ejercicio], #/tecnica[/herramienta]
// Cada sección es un módulo con mount(el) (una vez), route(sub) (en cada cambio) y leave() (al salir).
import { $, prefs, setPref } from './ui.js';

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

async function route() {
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
  if (current !== sec) window.scrollTo(0, 0);
  current = sec;
  loaded[sec].route?.(sub);
}
window.addEventListener('hashchange', route);
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
  renderSettings();
});
renderSettings();
if (!location.hash) history.replaceState(null, '', location.pathname + location.search + '#/info');
route();
