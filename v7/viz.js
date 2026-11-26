// Gráficos musicales compartidos (SVG en texto): teclado, reloj cromático, círculo de quintas,
// barra de tonos y semitonos, pila de terceras y regla de intervalos.
// Todos devuelven un <svg role="img"> con aria-label, escalan con el ancho del contenedor y usan la misma paleta.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const mod = (n, m = 12) => ((n % m) + m) % m;

// Color por función dentro del acorde: así "la 3ra" se ve igual en todos los gráficos de la app.
export const ROLE = { 1: '#1E1E1E', 3: '#E07A1F', 5: '#2C6DB5', 7: '#2E9A5F', t: '#8E4CC0', x: '#9a9aa3' };
export const ROLE_NAME = { 1: 'Tónica', 3: '3ra', 5: '5ta', 7: '7ma', t: 'Tensión' };
// rol de un intervalo de fórmula ('b3' -> 3, '#11' -> t)
export function roleOf(iv) {
  const d = Number(String(iv).replace(/[^0-9]/g, ''));
  if (d === 1 || d === 8) return 1;
  if (d === 3) return 3;
  if (d === 5) return 5;
  if (d === 7 || d === 6) return d === 7 ? 7 : 't';
  return 't';
}
// Función armónica (tónica / subdominante / dominante)
export const FN_COLOR = { Tónica: '#2C6DB5', Subdominante: '#2E9A5F', Dominante: '#CE3468' };

const svg = (w, h, label, body, cls = '') => `<svg class="viz ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const txt = (x, y, t, a = '') => `<text x="${x}" y="${y}" ${a}>${esc(t)}</text>`;

// ---------------------------------------------------------------- teclado
// marks: [{ i: semitono desde el Do de la izquierda (0..), label, color, sub }]
const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK_X = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 }; // tecla blanca a la izquierda de cada negra
export function keyboard(marks, { octaves = 2, label = 'Teclado', names = null } = {}) {
  const ww = 26, wh = 96, bw = 16, bh = 58;
  const n = octaves * 7;
  const W = n * ww + 2, H = wh + 30;
  const at = new Map(marks.map((m) => [m.i, m]));
  let body = '';
  const dot = (cx, cy, m, black) => `<g class="kb-m"><circle cx="${cx}" cy="${cy}" r="10" fill="${m.color || ROLE[1]}"/>${txt(cx, cy + 3.6, m.label ?? '', `class="kb-l${String(m.label ?? '').length > 2 ? ' sm' : ''}"`)}</g>${m.sub ? txt(cx, H - 6, m.sub, `class="kb-s${black ? ' bk' : ''}"`) : ''}`;
  for (let k = 0; k < n; k++) {
    const oct = Math.floor(k / 7), i = oct * 12 + WHITE[k % 7];
    const x = 1 + k * ww;
    body += `<rect class="kb-w" x="${x}" y="1" width="${ww}" height="${wh}" rx="3"/>`;
    if (names && k % 7 === 0) body += txt(x + ww / 2, wh - 6, names[0], 'class="kb-c"');
  }
  for (let k = 0; k < n; k++) {
    const oct = Math.floor(k / 7), i = oct * 12 + WHITE[k % 7];
    if (at.has(i)) body += dot(1 + k * ww + ww / 2, wh - 22, at.get(i), false);
  }
  for (let o = 0; o < octaves; o++) {
    Object.entries(BLACK_X).forEach(([s, wk]) => {
      const i = o * 12 + Number(s);
      const x = 1 + (o * 7 + wk + 1) * ww - bw / 2;
      body += `<rect class="kb-b" x="${x}" y="1" width="${bw}" height="${bh}" rx="2"/>`;
      if (at.has(i)) body += dot(x + bw / 2, bh - 14, at.get(i), true);
    });
  }
  return svg(W, H, label, body, 'kb');
}

// ---------------------------------------------------------------- reloj cromático
// Las 12 alturas en círculo con la tónica arriba; las notas de la escala o acorde forman una figura.
// items: [{ k: semitonos desde la tónica, name, iv, color }], pairs: [[k1, k2, color]] líneas extra (ej. tritono)
const IVS = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
export function clock(items, { label = 'Reloj cromático', pairs = [], polygon = true, size = 220 } = {}) {
  const c = size / 2, R = size / 2 - 38;
  const pt = (k, r) => [c + r * Math.sin((k * Math.PI) / 6), c - r * Math.cos((k * Math.PI) / 6)];
  const on = new Map(items.map((it) => [mod(it.k), it]));
  let body = `<circle class="ck-ring" cx="${c}" cy="${c}" r="${R}"/>`;
  for (let k = 0; k < 12; k++) {
    const [x, y] = pt(k, R + 23);
    body += txt(x, y + 4, on.get(k)?.iv ?? IVS[k], `class="ck-iv${on.has(k) ? ' on' : ''}"`);
  }
  if (polygon && on.size > 2) {
    const ks = [...on.keys()].sort((a, b) => a - b);
    body += `<polygon class="ck-poly" points="${ks.map((k) => pt(k, R).join(',')).join(' ')}"/>`;
  }
  pairs.forEach(([a, b, col]) => {
    const [x1, y1] = pt(a, R), [x2, y2] = pt(b, R);
    body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col || ROLE.t}" stroke-width="2.4" stroke-dasharray="5 4"/>`;
  });
  for (let k = 0; k < 12; k++) {
    const [x, y] = pt(k, R);
    const it = on.get(k);
    if (it) body += `<circle cx="${x}" cy="${y}" r="13" fill="${it.color || ROLE[1]}"/>${txt(x, y + 3.8, it.name ?? '', `class="ck-n${String(it.name ?? '').length > 3 ? ' sm' : ''}"`)}`;
    else body += `<circle class="ck-off" cx="${x}" cy="${y}" r="4"/>`;
  }
  return svg(size, size, label, body, 'ck');
}

// ---------------------------------------------------------------- círculo de quintas
// names: nombres de las 12 tónicas mayores en orden de quintas desde Do; minors: sus relativas menores.
// marks: [{ pos: 0..11 (orden de quintas), ring: 'out' | 'in', color, label }], arrows: [[pos1, pos2, color, ring]]
export function fifths(names, minors, { marks = [], arrows = [], label = 'Círculo de quintas', size = 260 } = {}) {
  const c = size / 2, Ro = size / 2 - 22, Ri = Ro - 40;
  const pt = (p, r) => [c + r * Math.sin((p * Math.PI) / 6), c - r * Math.cos((p * Math.PI) / 6)];
  const mk = (p, ring) => marks.find((m) => m.pos === p && (m.ring || 'out') === ring);
  let body = `<circle class="cf-ring" cx="${c}" cy="${c}" r="${Ro}"/><circle class="cf-ring in" cx="${c}" cy="${c}" r="${Ri}"/>`;
  body += `<defs><marker id="cfa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>`;
  arrows.forEach(([a, b, col]) => {
    const r = (Ro + Ri) / 2 - 2; // entre los dos anillos, sin tapar nombres
    let bb = b;
    if (bb - a > 6) bb -= 12;
    if (a - bb > 6) bb += 12;
    const d = Math.abs(bb - a);
    const [x1, y1] = pt(a, r), [x2, y2] = pt(bb, r);
    const [qx, qy] = pt((a + bb) / 2, r * Math.max(0.12, 0.92 - 0.13 * d));
    body += `<path d="M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}" fill="none" stroke="${col || ROLE[3]}" stroke-width="2.4" stroke-linecap="round" marker-end="url(#cfa)"/>`;
  });
  for (let p = 0; p < 12; p++) {
    [['out', Ro, names[p]], ['in', Ri, minors[p]]].forEach(([ring, r, nm]) => {
      const [x, y] = pt(p, r);
      const m = mk(p, ring);
      const rr = ring === 'out' ? 17 : 14;
      body += m ? `<circle cx="${x}" cy="${y}" r="${rr}" fill="${m.color || ROLE[1]}"/>${txt(x, y + 4, m.label ?? nm, `class="cf-n on${ring === 'in' ? ' in' : ''}"`)}`
        : txt(x, y + 4, nm, `class="cf-n${ring === 'in' ? ' in' : ''}"`);
    });
  }
  return svg(size, size, label, body, 'cf');
}

// ---------------------------------------------------------------- barra de tonos y semitonos
// notes: nombres de las notas (incluida la octava al final), intervals: fórmula (sin la octava)
export function steps(notes, intervals, { label = 'Tonos y semitonos', mark = new Set() } = {}) {
  const st = intervals.map(ivSemis);
  st.push(12);
  const u = 34, W = 12 * u + 28, H = 80;
  let body = '', x = 14;
  for (let i = 0; i < st.length - 1; i++) {
    const d = st[i + 1] - st[i];
    const w = d * u;
    const t = { 1: 'st', 2: 'T', 3: 'T+st' }[d] || d;
    body += `<rect class="sb-b s${d}" x="${x + 2}" y="30" width="${w - 4}" height="24" rx="6"/>${txt(x + w / 2, 46.5, t, 'class="sb-t"')}`;
    body += `<line class="sb-tick" x1="${x}" y1="26" x2="${x}" y2="58"/>${txt(x, 19, notes[i], `class="sb-n${mark.has(i) ? ' mk' : ''}"`)}${txt(x, 75, intervals[i], 'class="sb-i"')}`;
    x += w;
  }
  body += `<line class="sb-tick" x1="${x}" y1="26" x2="${x}" y2="58"/>${txt(x, 19, notes[notes.length - 1], 'class="sb-n"')}${txt(x, 75, '8', 'class="sb-i"')}`;
  return svg(W, H, label, body, 'sb');
}
const BASE = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14, 11: 17, 13: 21 };
function ivSemis(iv) {
  const m = String(iv).match(/^(bb|b|##|#)?(\d+)$/);
  return BASE[Number(m[2])] + ({ bb: -2, b: -1, '': 0, '#': 1, '##': 2 }[m[1] || '']);
}

// ---------------------------------------------------------------- pila de terceras
// notes: [{ name, iv }] de la fundamental hacia arriba; gaps: nombres de los intervalos entre notas (3M, 3m)
export function stack(notes, gaps, { label = 'Acorde por terceras' } = {}) {
  const rowH = 34, W = 200, H = notes.length * rowH + 8;
  let body = '';
  notes.forEach((n, i) => {
    const y = H - 4 - (i + 1) * rowH;
    const col = ROLE[roleOf(n.iv)];
    body += `<rect x="40" y="${y + 4}" width="96" height="${rowH - 8}" rx="8" fill="${col}"/>${txt(88, y + rowH / 2 + 5, n.name, 'class="st-n"')}${txt(28, y + rowH / 2 + 5, n.iv, 'class="st-i"')}`;
    // entre esta nota y la de abajo: llave con el intervalo (3M / 3m)
    if (i > 0) body += `<path class="st-br" d="M142 ${y + rowH / 2} h6 v${rowH} h-6"/>${txt(176, y + rowH + 4, gaps[i - 1], 'class="st-g"')}`;
  });
  return svg(W, H, label, body, 'st');
}

// ---------------------------------------------------------------- regla de intervalo
// Cuenta notas (distancia) y semitonos (género) entre dos notas escritas.
// letters: nombres de las notas que se cuentan (de la primera a la última), semis: semitonos totales
export function ruler(letters, semis, { label = 'Intervalo', name = '' } = {}) {
  const u = 34, W = Math.max(13, semis + 1) * u + 20, H = 96;
  let body = '';
  for (let s = 0; s <= Math.max(12, semis); s++) {
    const x = 10 + s * u;
    body += `<rect class="rl-c${s === 0 || s === semis ? ' on' : s < semis ? ' in' : ''}" x="${x + 1}" y="36" width="${u - 2}" height="20" rx="4"/>${s <= semis ? txt(x + u / 2, 50.5, s, 'class="rl-s"') : ''}`;
  }
  // distancia: las letras arriba, repartidas
  const lx = (i) => 10 + u / 2 + (letters.length > 1 ? (i * semis * u) / (letters.length - 1) : 0);
  letters.forEach((l, i) => (body += `${txt(lx(i), 26, l, `class="rl-l${i === 0 || i === letters.length - 1 ? ' end' : ''}"`)}${txt(lx(i), 11, i + 1, 'class="rl-k"')}`));
  body += `<path class="rl-br" d="M${10 + u / 2} 60 v6 H${10 + semis * u + u / 2} v-6"/>${txt(10 + u / 2 + (semis * u) / 2, 82, `${semis} semitonos${name ? ' · ' + name : ''}`, 'class="rl-t"')}`;
  return svg(W, H, label, body, 'rl');
}

// Leyenda de roles (para acompañar teclados y relojes)
export function roleLegend(roles = [1, 3, 5, 7, 't']) {
  return `<p class="viz-legend">${roles.map((r) => `<span><i style="background:${ROLE[r]}"></i>${ROLE_NAME[r]}</span>`).join('')}</p>`;
}
