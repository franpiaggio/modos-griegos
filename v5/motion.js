// Animaciones suaves con GSAP (si no carga o el usuario pidió menos movimiento, no se anima nada).
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const g = () => (!reduce.matches && window.gsap) || null;
const EASE = 'power3.out';

// Entrada escalonada de los bloques de una vista
const ENTER_SEL = [
  '.sec-head', '.t-intro', '.t-head', '.t-group h2', '.g-info', '.card', '.tc-card', '.tc-box', '.tc-h2', '.tc-rec a',
  '.q-head', '.q-card', '.cap-progress', '.cap-next', '.cp-item', '.cap-logros', '.cap-desc', '.cap-sec', '.cap-nav', '.ex-panel', '.fx-pick', '.fx-bar', '.fx-list > *', '.fx-paper', '.vc-card', '.ex-item', '.info-card',
].join(',');
export function enter(container) {
  const gs = g(); if (!gs || !container) return;
  const items = [...container.querySelectorAll(ENTER_SEL)].filter((e) => e.offsetParent !== null).slice(0, 40);
  if (!items.length) return;
  gs.killTweensOf(items);
  gs.fromTo(items, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: EASE, stagger: { each: 0.035, from: 'start' }, clearProps: 'transform,opacity,visibility' });
}

// Corrección: pulso suave si está bien, sacudida corta si está mal; la explicación se despliega
export function feedback(card, ok) {
  const gs = g(); if (!gs || !card) return;
  if (ok) gs.fromTo(card, { scale: 1 }, { scale: 1.012, duration: 0.16, yoyo: true, repeat: 1, ease: 'sine.inOut', clearProps: 'transform' });
  else gs.fromTo(card, { x: 0 }, { keyframes: { x: [-7, 6, -4, 2, 0] }, duration: 0.42, ease: 'power1.out', clearProps: 'transform' });
  const fb = card.querySelector('.fb');
  if (fb) gs.fromTo(fb, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE, delay: 0.05, clearProps: 'transform,opacity,visibility' });
}

// Pregunta nueva: entra desde la derecha
export function nextCard(card) {
  const gs = g(); if (!gs || !card) return;
  gs.fromTo(card, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: EASE, clearProps: 'transform,opacity,visibility' });
}

// Cambio de contenido (hoja de Información): fundido corto
export function swap(el) {
  const gs = g(); if (!gs || !el) return;
  gs.fromTo(el, { autoAlpha: 0.25, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity,visibility' });
}

// Indicador deslizante de la pestaña activa
export function moveIndicator(ind, target, instant = false) {
  if (!ind || !target) return;
  const x = target.offsetLeft;
  const w = target.offsetWidth;
  const gs = g();
  if (!gs || instant) { ind.style.transform = `translateX(${x}px)`; ind.style.width = `${w}px`; return; }
  gs.to(ind, { x, width: w, duration: 0.45, ease: 'power3.inOut' });
}

// Número que cuenta hasta su valor (resumen de sesión)
export function countTo(el, to, suffix = '') {
  const gs = g();
  if (!gs || !el) { if (el) el.textContent = to + suffix; return; }
  const o = { v: 0 };
  gs.to(o, { v: to, duration: 0.9, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v) + suffix) });
}

// Pulso del pulso del metrónomo (lo usa Técnica si existe)
export function beat(el, accent) {
  const gs = g(); if (!gs || !el) return;
  gs.fromTo(el, { scale: accent ? 1.22 : 1.12 }, { scale: 1, duration: 0.32, ease: 'power2.out' });
}
