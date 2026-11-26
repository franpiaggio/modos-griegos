// Utilidades de interfaz compartidas por los módulos de la v7.
export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const store = {
  get(k, d) { try { const v = localStorage.getItem('v7.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('v7.' + k, JSON.stringify(v)); } catch {} },
};

// Preferencias globales (las comparten todas las secciones)
export const prefs = Object.assign({ tonic: 'negra', labels: 'finger', notation: 'latin', neck: 'on', sound: 'nylon', libre: 'off', mano: 'off' }, store.get('settings', {}));
const listeners = new Set();
export function setPref(k, v) {
  prefs[k] = v;
  store.set('settings', prefs);
  listeners.forEach((f) => f(k, v));
}
export const onPrefs = (f) => listeners.add(f);

let toastTimer = null;
// link opcional: { href, label } (se agrega un enlace al final del aviso)
export function toast(msg, keep = false, link = null) {
  const t = $('toast');
  t.textContent = msg;
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    a.addEventListener('click', () => (t.hidden = true));
    t.append(' ', a);
  }
  t.hidden = false;
  clearTimeout(toastTimer);
  if (!keep) toastTimer = setTimeout(() => (t.hidden = true), link ? 4200 : 2400);
}

export const go = (hash) => { if (location.hash !== hash) location.hash = hash; };

// Iconos de trazo (24x24)
export const ICON = {
  play: '<svg viewBox="0 0 24 24" class="fill" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" class="fill" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
};
