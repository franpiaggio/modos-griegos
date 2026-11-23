// Motor de metrónomo reutilizable: programación anticipada sobre AudioContext.currentTime.
// Cada 25 ms agenda los clics de los próximos 100 ms, así el tempo no depende de los timers del navegador.
import { getCtx, clickAt } from './audio.js';

export const METERS = [
  { id: '2/4', beats: 2, unit: 4 }, { id: '3/4', beats: 3, unit: 4 }, { id: '4/4', beats: 4, unit: 4 },
  { id: '5/4', beats: 5, unit: 4 }, { id: '6/8', beats: 6, unit: 8 }, { id: '7/8', beats: 7, unit: 8 },
  { id: '12/8', beats: 12, unit: 8 },
];
// Acentos por defecto: 1 = acento, 0 = normal, -1 = silencio. En 6/8 y 12/8 se acentúa cada grupo de 3.
export function defaultAccents(beats, unit = 4) {
  return Array.from({ length: beats }, (_, i) => {
    if (i === 0) return 1;
    if (unit === 8 && beats % 3 === 0 && i % 3 === 0) return 1;
    if (unit === 8 && beats === 7 && (i === 2 || i === 4)) return 1; // 7/8 = 2+2+3
    return 0;
  });
}

/**
 * createMetronome({ onVisual(beat, sub, bar), onBeat(beat, sub, bar, when, barDur), onBar(bar, bpm), onStop() })
 * cfg: { bpm, beats, sub (1-4), accents[], click (bool), gap {on, play, mute}, trainer {on, step, every, max, mode:'up'|'mountain'} }
 */
export function createMetronome(hooks = {}) {
  const cfg = { bpm: 80, beats: 4, unit: 4, sub: 1, accents: defaultAccents(4), click: true, volume: 1,
    gap: { on: false, play: 2, mute: 2 }, trainer: { on: false, step: 4, every: 4, max: 140, mode: 'up' } };
  let timer = null;
  let next = 0;
  let beat = 0;
  let sub = 0;
  let bar = 0;
  let startBpm = 80;
  let dir = 1;
  let barsAtTempo = 0;
  const visuals = [];

  const secPerSub = () => 60 / cfg.bpm / cfg.sub;

  function advanceBar() {
    bar++;
    barsAtTempo++;
    const t = cfg.trainer;
    if (t.on && barsAtTempo >= t.every) {
      barsAtTempo = 0;
      let nb = cfg.bpm + t.step * dir;
      if (t.mode === 'mountain') {
        if (dir > 0 && nb >= t.max) { nb = t.max; dir = -1; }
        else if (dir < 0 && nb <= startBpm) { nb = startBpm; dir = 1; }
      } else nb = Math.min(nb, t.max);
      cfg.bpm = Math.max(20, Math.min(300, nb));
    }
    hooks.onBar?.(bar, cfg.bpm);
  }

  function muted() {
    const g = cfg.gap;
    return g.on && bar % (g.play + g.mute) >= g.play;
  }

  function tick() {
    const ctx = getCtx();
    while (next < ctx.currentTime + 0.1) {
      const acc = cfg.accents[beat] ?? 0;
      const silent = !cfg.click || muted() || acc === -1;
      if (!silent) clickAt(next, sub === 0 ? (acc === 1 ? 'accent' : 'beat') : 'sub', cfg.volume);
      hooks.onBeat?.(beat, sub, bar, next, secPerSub() * cfg.sub * cfg.beats);
      const b = beat, s = sub, br = bar, mutedNow = muted();
      const delay = Math.max(0, (next - ctx.currentTime) * 1000);
      visuals.push(setTimeout(() => hooks.onVisual?.(b, s, br, mutedNow), delay));
      if (visuals.length > 64) visuals.splice(0, 32);
      next += secPerSub();
      sub++;
      if (sub >= cfg.sub) {
        sub = 0;
        beat++;
        if (beat >= cfg.beats) { beat = 0; advanceBar(); }
      }
    }
  }

  return {
    cfg,
    get running() { return timer !== null; },
    get bar() { return bar; },
    set(patch) {
      Object.assign(cfg, patch);
      if (patch.beats != null && (!patch.accents || patch.accents.length !== cfg.beats)) cfg.accents = defaultAccents(cfg.beats, cfg.unit);
      if (patch.bpm != null && timer) { startBpm = Math.min(startBpm, cfg.bpm); }
    },
    start() {
      if (timer) return;
      const ctx = getCtx();
      next = ctx.currentTime + 0.08;
      beat = 0; sub = 0; bar = 0; dir = 1; barsAtTempo = 0;
      startBpm = cfg.bpm;
      timer = setInterval(tick, 25);
      tick();
    },
    stop() {
      clearInterval(timer);
      timer = null;
      visuals.forEach(clearTimeout);
      visuals.length = 0;
      hooks.onStop?.();
    },
    toggle() { this.running ? this.stop() : this.start(); },
  };
}

// Tap tempo: promedio de los últimos toques (se reinicia tras 2 s sin tocar)
export function tapper() {
  let taps = [];
  return () => {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length < 2) return null;
    const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    return Math.max(20, Math.min(300, Math.round(60000 / avg)));
  };
}

export function tempoName(bpm) {
  if (bpm < 60) return 'Largo';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 168) return 'Allegro';
  return 'Presto';
}
