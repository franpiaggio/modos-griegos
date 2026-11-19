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
