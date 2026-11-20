// Sonido de cuerda pulsada (Karplus-Strong) con programación precisa sobre AudioContext.currentTime.
let ctx = null;
let master = null;
const cache = new Map();

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function pluckBuffer(midi) {
  if (cache.has(midi)) return cache.get(midi);
  const sr = ctx.sampleRate;
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const len = Math.floor(sr * 2.2);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  // suaviza el ataque (púa más redonda)
  for (let p = 0; p < 2; p++) for (let i = 1; i < N; i++) ring[i] = 0.5 * (ring[i] + ring[i - 1]);
  const decay = 0.996 - Math.min(0.006, (midi - 40) * 0.00012);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % N;
    const v = ring[idx];
    out[i] = v;
    ring[idx] = decay * 0.5 * (v + ring[next]);
    idx = next;
  }
  // fade final
  const fade = Math.floor(sr * 0.05);
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  cache.set(midi, buf);
  return buf;
}

function playAt(midi, when, dur) {
  const src = ctx.createBufferSource();
  src.buffer = pluckBuffer(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, when);
  g.gain.setTargetAtTime(0, when + dur * 1.6, 0.08);
  src.connect(g).connect(master);
  src.start(when);
  src.stop(when + dur * 1.6 + 0.6);
  return src;
}

let timer = null;
let active = [];
let visuals = [];

export function stop() {
  clearInterval(timer);
  timer = null;
  active.forEach((s) => { try { s.stop(); } catch {} });
  active = [];
  visuals.forEach(clearTimeout);
  visuals = [];
}

export const isPlaying = () => timer !== null;

/**
 * Reproduce una secuencia de notas. seq: [{midi, key}], opciones: {bpm, loop, onNote(key|null), onEnd()}
 * Programa con 120 ms de anticipación para que el tempo no se corra.
 */
export function play(seq, { bpm = 80, loop = false, onNote = () => {}, onEnd = () => {} } = {}) {
  stop();
  if (!seq.length) return;
  ensure();
  const step = 60 / bpm / 2; // corcheas
  let i = 0;
  let t = ctx.currentTime + 0.08;
  timer = setInterval(() => {
    while (t < ctx.currentTime + 0.12) {
      if (i >= seq.length) {
        if (!loop) {
          const endAt = t;
          clearInterval(timer);
          timer = null;
          setTimeout(() => { onNote(null); onEnd(); }, Math.max(0, (endAt - ctx.currentTime) * 1000));
          return;
        }
        i = 0;
        t += step; // respiro al repetir
      }
      const n = seq[i];
      active.push(playAt(n.midi, t, step));
      const delay = Math.max(0, (t - ctx.currentTime) * 1000);
      visuals.push(setTimeout(() => timer !== null && onNote(n.key), delay));
      i++;
      t += step;
    }
    if (active.length > 64) active = active.slice(-32);
  }, 25);
}

// Para tocar una sola nota al hacer clic
export function pluck(midi) {
  ensure();
  playAt(midi, ctx.currentTime + 0.01, 0.4);
}

// ---------------------------------------------------------------- v4: utilidades compartidas
// Contexto y salida (para el metrónomo y otros programadores propios)
export function getCtx() { ensure(); return ctx; }
export function out() { ensure(); return master; }

// Una nota en un instante dado (segundos de AudioContext). Devuelve la fuente para poder detenerla.
export function noteAt(midi, when, dur = 0.5, gain = 0.9) {
  ensure();
  const src = ctx.createBufferSource();
  src.buffer = pluckBuffer(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, when);
  g.gain.setTargetAtTime(0, when + dur, 0.09);
  src.connect(g).connect(master);
  src.start(when);
  src.stop(when + dur + 0.7);
  return src;
}

// Acorde rasgueado (de grave a agudo) o plaqué (strum = 0)
export function chordAt(midis, when, dur = 1.5, strum = 0.025, gain = 0.55) {
  return [...midis].sort((a, b) => a - b).map((m, i) => noteAt(m, when + i * strum, dur, gain));
}
export function playChord(midis, opts = {}) {
  ensure();
  return chordAt(midis, ctx.currentTime + 0.03, opts.dur ?? 1.6, opts.strum ?? 0.03, opts.gain ?? 0.55);
}
// Notas en sucesión (intervalos melódicos, escalas cortas). Devuelve la duración total en segundos.
export function playSeq(midis, { step = 0.45, dur = 0.5, gain = 0.85 } = {}) {
  ensure();
  const t0 = ctx.currentTime + 0.05;
  midis.forEach((m, i) => (Array.isArray(m) ? chordAt(m, t0 + i * step, dur * 1.6, 0.012, 0.5) : noteAt(m, t0 + i * step, dur, gain)));
  return midis.length * step + 0.1;
}

// Clic de metrónomo: tipo 'accent' | 'beat' | 'sub'
export function clickAt(when, type = 'beat', vol = 1) {
  ensure();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = { accent: 1760, beat: 1100, sub: 760 }[type] || 1100;
  const peak = { accent: 0.9, beat: 0.6, sub: 0.32 }[type] * vol;
  o.type = 'triangle';
  o.frequency.setValueAtTime(f, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  o.connect(g).connect(master);
  o.start(when);
  o.stop(when + 0.07);
}

// Bordón sostenido (pad suave con dos osciladores por nota). Devuelve una función para apagarlo.
export function drone(midis, vol = 0.18) {
  ensure();
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.6);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  lp.connect(g).connect(master);
  const oscs = [];
  midis.forEach((m) => {
    const f = 440 * 2 ** ((m - 69) / 12);
    [[-4, 'sawtooth'], [4, 'triangle']].forEach(([det, type]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = det;
      const og = ctx.createGain();
      og.gain.value = 0.5 / midis.length;
      o.connect(og).connect(lp);
      o.start();
      oscs.push(o);
    });
  });
  return () => {
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    oscs.forEach((o) => o.stop(t + 0.45));
  };
}
