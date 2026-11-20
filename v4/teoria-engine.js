// Motor de ejercicios de teoría: sesión de N preguntas, entrada de notas / opciones, corrección y resumen.
// Una pregunta es:
// { kicker, prompt(), sub?(), kind: 'notes'|'choice'|'multi',
//   slots, given?: [nota fija al inicio], ordered: bool,      (notes)
//   options: [{id, label()}]                                   (choice / multi)
//   answer: [notas] | id | [ids], check?(resp) -> {ok, msg?},
//   answerText(), explain(), listen?() (suena antes de responder), sound?() (suena al corregir) }
import { LETTERS, LATIN, note, noteName, notePc, sameNote } from './theory.js';
import { prefs, store, esc, ICON } from './ui.js';
import * as motion from './motion.js';

const val = (x) => (typeof x === 'function' ? x() : x ?? '');
export const N = (n) => noteName(n, prefs.notation);
export const NL = (list) => list.map(N).join(' ');
const ACCS = [[-2, 'bb', '𝄫'], [-1, 'b', '♭'], [0, '', '♮'], [1, '#', '♯'], [2, '##', '𝄪']];

// ---------------------------------------------------------------- estadísticas
export function stats(id) { return store.get('teoria.stats', {})[id] || null; }
function saveStats(id, pct) {
  const all = store.get('teoria.stats', {});
  const s = all[id] || { best: 0, sessions: 0, history: [] };
  s.best = Math.max(s.best, pct);
  s.last = pct;
  s.sessions += 1;
  s.history = [...s.history, { t: Date.now(), pct }].slice(-30);
  all[id] = s;
  store.set('teoria.stats', all);
}

// ---------------------------------------------------------------- corrección de notas
export function checkNotes(q, resp) {
  if (q.check) return q.check(resp);
  const want = q.answer;
  if (resp.length !== want.length) return { ok: false, msg: `Faltan notas: son ${want.length}.` };
  const eq = q.ordered
    ? resp.every((n, i) => sameNote(n, want[i]))
    : resp.every((n) => want.some((w) => sameNote(w, n))) && new Set(resp.map((n) => n.l * 10 + n.a)).size === resp.length;
  if (eq) return { ok: true };
  // ¿mismas alturas pero otra escritura?
  const pcs = (l) => l.map(notePc);
  const samePitch = q.ordered
    ? pcs(resp).every((p, i) => p === notePc(want[i]))
    : pcs(resp).every((p) => pcs(want).includes(p)) && new Set(pcs(resp)).size === want.length;
  if (samePitch) return { ok: false, msg: 'Suena igual, pero está mal escrito: cada grado usa su propia letra (enarmonía).' };
  if (q.ordered && resp.some((n, i) => sameNote(n, want[i])) === false) return { ok: false };
  return { ok: false };
}

// ---------------------------------------------------------------- sesión
export class Session {
  constructor(el, { id, title, back, gen, count = 10, onExit, headerExtra = '' }) {
    Object.assign(this, { el, id, title, back, gen, count, onExit, headerExtra });
    this.restart();
  }
  restart() {
    this.i = 0;
    this.right = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.mistakes = [];
    this.done = false;
    this.next();
  }
  next() {
    if (this.i >= this.count) return this.finish();
    let q = null;
    for (let k = 0; k < 40 && !q; k++) {
      q = this.gen();
      // evita repetir la misma pregunta seguida
      if (q && this.q && val(q.prompt) === val(this.q.prompt) && k < 39) q = null;
    }
    this.q = q;
    this.resp = q.given ? [...q.given] : [];
    this.sel = new Set();
    this.acc = 0;
    this.result = null;
    this.render();
    if (this.i > 0) motion.nextCard(this.el.querySelector('.q-card'));
    if (q.listen) setTimeout(() => q.listen(), 250);
  }
  // ---- render
  render() {
    if (this.done) return this.renderSummary();
    const q = this.q;
    const pct = (this.i / this.count) * 100;
    this.el.innerHTML = `
      <div class="q-head">
        <div class="q-progress" role="progressbar" aria-label="Progreso de la sesión" aria-valuemin="0" aria-valuemax="${this.count}" aria-valuenow="${this.i}"><span style="transform:scaleX(${pct / 100})"></span></div>
        <div class="q-meta"><span>${this.i + 1} de ${this.count}</span><span>${this.right} bien${this.streak > 1 ? ` · racha ${this.streak}` : ''}</span></div>
      </div>
      <article class="q-card ${this.result ? (this.result.ok ? 'is-ok' : 'is-bad') : ''}">
        <div class="q-kicker">${esc(val(q.kicker))}</div>
        <h2 class="q-prompt">${val(q.prompt)}</h2>
        ${q.sub ? `<p class="q-sub">${val(q.sub)}</p>` : ''}
        ${q.listen ? `<div class="q-listen">${(q.listenButtons || [['Escuchar', 'main']]).map(([t, k]) => `<button class="plain sm" data-listen="${k}">${ICON.sound}<span>${t}</span></button>`).join('')}</div>` : ''}
        <div class="q-input">${this.inputHtml()}</div>
        ${this.result ? this.feedbackHtml() : ''}
      </article>`;
    this.bind();
  }
  inputHtml() {
    const q = this.q;
    const locked = !!this.result;
    if (q.kind === 'notes') {
      const slots = Array.from({ length: q.slots }, (_, i) => {
        const n = this.resp[i];
        const fixed = q.given && i < q.given.length;
        let cls = 'slot' + (n ? ' full' : '') + (fixed ? ' fixed' : '') + (i === this.resp.length && !locked ? ' cur' : '');
        if (locked && n && q.ordered && q.answer[i]) cls += sameNote(n, q.answer[i]) ? ' good' : ' wrong';
        if (locked && n && !q.ordered) cls += q.answer.some((w) => sameNote(w, n)) ? ' good' : ' wrong';
        return `<span class="${cls}">${n ? esc(N(n)) : ''}</span>`;
      }).join('');
      const names = prefs.notation === 'latin' ? LATIN : LETTERS;
      return `<div class="slots" style="--n:${q.slots}" aria-live="polite">${slots}</div>
        ${locked ? '' : `<div class="pad">
          <div class="accs" role="group" aria-label="Alteración">${ACCS.map(([a, , g]) => `<button data-acc="${a}" class="${a === this.acc ? 'on' : ''}" aria-pressed="${a === this.acc}" title="${a === 0 ? 'Natural' : ''}">${g}</button>`).join('')}</div>
          <div class="letters">${names.map((t, l) => `<button data-l="${l}">${t}</button>`).join('')}</div>
          <div class="pad-act"><button class="plain sm" data-del>${ICON.undo}<span>Borrar</span></button><button class="primary" data-check ${this.resp.length < q.slots ? 'disabled' : ''}>Comprobar</button></div>
        </div>`}`;
    }
    const multi = q.kind === 'multi';
    const ans = multi ? new Set(q.answer) : new Set([q.answer]);
    const chips = q.options.map((o, k) => {
      let cls = 'opt';
      if (this.sel.has(o.id)) cls += ' on';
      if (locked) {
        if (ans.has(o.id)) cls += ' good';
        else if (this.sel.has(o.id)) cls += ' wrong';
      }
      return `<button class="${cls}" data-o="${esc(o.id)}" ${locked ? 'disabled' : ''} aria-pressed="${this.sel.has(o.id)}">${k < 9 && !multi ? `<kbd>${k + 1}</kbd>` : ''}${val(o.label)}</button>`;
    }).join('');
    return `<div class="opts ${q.wide ? 'wide' : ''}">${chips}</div>${multi && !locked ? `<div class="pad-act"><span class="hint-s">Elegí todas las que correspondan</span><button class="primary" data-check>Comprobar</button></div>` : ''}`;
  }
  feedbackHtml() {
    const q = this.q;
    const r = this.result;
    return `<div class="fb ${r.ok ? 'ok' : 'bad'}" role="status">
      <div class="fb-head">${r.ok ? ICON.check : ICON.x}<b>${r.ok ? 'Correcto' : 'No'}</b>${r.ok ? '' : `<span>Respuesta: <b>${val(q.answerText)}</b></span>`}</div>
      ${r.msg ? `<p class="fb-msg">${r.msg}</p>` : ''}
      <p class="fb-exp">${val(q.explain)}</p>
      <div class="fb-act">${q.sound ? `<button class="plain sm" data-sound>${ICON.sound}<span>Escuchar</span></button>` : '<span></span>'}<button class="primary" data-next>${this.i + 1 >= this.count ? 'Ver resultado' : 'Siguiente'} <kbd>Enter</kbd></button></div>
    </div>`;
  }
  bind() {
    const el = this.el;
    el.querySelectorAll('[data-listen]').forEach((b) => b.addEventListener('click', () => (b.dataset.listen === 'main' ? this.q.listen() : this.q.listenAlt?.(b.dataset.listen))));
    el.querySelectorAll('[data-acc]').forEach((b) => b.addEventListener('click', () => { this.acc = Number(b.dataset.acc); this.render(); }));
    el.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => this.addNote(Number(b.dataset.l))));
    el.querySelector('[data-del]')?.addEventListener('click', () => this.del());
    el.querySelector('[data-check]')?.addEventListener('click', () => this.submit());
    el.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => this.choose(b.dataset.o)));
    el.querySelector('[data-next]')?.addEventListener('click', () => { this.i += 1; this.next(); });
    el.querySelector('[data-sound]')?.addEventListener('click', () => this.q.sound());
    if (this.result) el.querySelector('[data-next]')?.focus({ preventScroll: true });
  }
  addNote(l) {
    if (this.result || this.resp.length >= this.q.slots) return;
    this.resp.push(note(l, this.acc));
    this.acc = 0;
    this.render();
    if (this.q.slots === 1) this.submit();
  }
  del() {
    const min = this.q.given ? this.q.given.length : 0;
    if (this.result || this.resp.length <= min) return;
    this.resp.pop();
    this.render();
  }
  choose(id) {
    if (this.result) return;
    if (this.q.kind === 'multi') {
      this.sel.has(id) ? this.sel.delete(id) : this.sel.add(id);
      return this.render();
    }
    this.sel = new Set([id]);
    this.submit();
  }
  submit() {
    if (this.result) return;
    const q = this.q;
    let r;
    if (q.kind === 'notes') {
      if (this.resp.length < q.slots) return;
      r = checkNotes(q, this.resp);
    } else if (q.kind === 'multi') {
      r = q.check ? q.check([...this.sel]) : { ok: this.sel.size === q.answer.length && q.answer.every((a) => this.sel.has(a)) };
    } else {
      const id = [...this.sel][0];
      r = q.check ? q.check(id) : { ok: id === q.answer };
    }
    this.result = r;
    if (r.ok) { this.right += 1; this.streak += 1; this.bestStreak = Math.max(this.bestStreak, this.streak); }
    else { this.streak = 0; this.mistakes.push({ prompt: val(q.prompt), answer: val(q.answerText) }); }
    this.render();
    motion.feedback(this.el.querySelector('.q-card'), r.ok);
    q.sound?.();
  }
  finish() {
    this.done = true;
    const pct = Math.round((this.right / this.count) * 100);
    saveStats(this.id, pct);
    this.renderSummary();
  }
  renderSummary() {
    const pct = Math.round((this.right / this.count) * 100);
    const s = stats(this.id);
    const msg = pct === 100 ? '¡Perfecto!' : pct >= 80 ? 'Muy bien.' : pct >= 50 ? 'Vas bien; repasá los errores.' : 'Practicalo de nuevo con menos opciones.';
    this.el.innerHTML = `<article class="q-card summary">
      <div class="sum-pct"><b>${pct}%</b><span>${this.right} de ${this.count} · ${msg}</span></div>
      <div class="sum-meta"><span>Mejor: <b>${s?.best ?? pct}%</b></span><span>Racha máx.: <b>${this.bestStreak}</b></span><span>Sesiones: <b>${s?.sessions ?? 1}</b></span></div>
      ${this.mistakes.length ? `<h2 class="sum-h">Para repasar</h2><ul class="mist">${this.mistakes.map((m) => `<li><span>${m.prompt}</span><b>${m.answer}</b></li>`).join('')}</ul>` : ''}
      <div class="fb-act"><button class="plain" data-exit>Volver</button><button class="primary" data-again>Otra vez <kbd>Enter</kbd></button></div>
    </article>`;
    motion.countTo(this.el.querySelector('.sum-pct b'), pct, '%');
    motion.enter(this.el);
    this.el.querySelector('[data-again]').addEventListener('click', () => this.restart());
    this.el.querySelector('[data-exit]').addEventListener('click', () => this.onExit?.());
    this.el.querySelector('[data-again]').focus({ preventScroll: true });
  }
  // ---- teclado
  key(e) {
    if (this.done) { if (e.key === 'Enter') { e.preventDefault(); this.restart(); } return; }
    const q = this.q;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.result) { this.i += 1; this.next(); } else this.submit();
      return;
    }
    if (this.result) return;
    if (q.kind === 'notes') {
      const k = e.key.toLowerCase();
      const l = 'cdefgab'.indexOf(k);
      if (l >= 0 && e.key.length === 1) { e.preventDefault(); this.addNote(l); }
      else if (e.key === '#') { this.acc = this.acc === 1 ? 2 : 1; this.render(); }
      else if (e.key === '-') { this.acc = this.acc === -1 ? -2 : -1; this.render(); }
      else if (e.key === '=') { this.acc = 0; this.render(); }
      else if (e.key === 'Backspace') { e.preventDefault(); this.del(); }
    } else if (q.kind === 'choice' && /^[1-9]$/.test(e.key)) {
      const o = q.options[Number(e.key) - 1];
      if (o) this.choose(o.id);
    }
  }
}

// ---------------------------------------------------------------- panel de opciones
// groups: [{ key, label, multi?, options: [[value, label]] , min? }]
export function settingsHtml(groups, cfg) {
  return groups.map((g) => `<div class="cfg-row"><span>${g.label}</span><div class="chips" data-key="${g.key}" data-multi="${g.multi ? 1 : 0}">${g.options.map(([v, t]) => {
    const on = g.multi ? cfg[g.key].includes(v) : cfg[g.key] === v;
    return `<button data-v="${esc(v)}" class="${on ? 'on' : ''}" aria-pressed="${on}">${t}</button>`;
  }).join('')}</div></div>`).join('');
}
export function bindSettings(el, groups, cfg, onChange) {
  el.querySelectorAll('.chips').forEach((box) => box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const key = box.dataset.key;
    const g = groups.find((x) => x.key === key);
    const v = typeof g.options[0][0] === 'number' ? Number(b.dataset.v) : b.dataset.v;
    if (g.multi) {
      const has = cfg[key].includes(v);
      if (has && cfg[key].length <= (g.min ?? 1)) return;
      cfg[key] = has ? cfg[key].filter((x) => x !== v) : [...cfg[key], v];
    } else cfg[key] = v;
    onChange();
  }));
}
