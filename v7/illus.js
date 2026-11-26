// Ilustraciones de la v7: dibujos SVG propios, sin texto, con la estética del libro
// (tinta, madera del diapasón y el color de cada modo). Todas son decorativas (aria-hidden).

const INK = '#1b1b1f';
const WOOD = '#4a3328';
const WOOD2 = '#3a2720';
const FRET = '#cfccc6';
const STR = '#d9d2c4';
const BONE = '#f1ebdf';
const ROOT = '#CE3468';

// Color de cada capítulo (tomado de los modos) y su fondo suave
export const TINT = {
  pentatonica: ['#2C6DB5', '#e6eef8'],
  acordes: ['#2E9A5F', '#e5f3eb'],
  tonal: ['#CE3468', '#f9e7ed'],
  modos: ['#8E4CC0', '#f1e8f8'],
  tecnica: ['#E07A1F', '#fbefe2'],
  extensiones: ['#14A0A8', '#e2f4f5'],
  final: ['#7A5536', '#f2ebe5'],
};

const svg = (vb, body, cls = '') => `<svg class="ill ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;

// Posición de cada traste según la regla de la guitarra real (cada traste es más angosto que el anterior)
const fretX = (n, x0, scale) => x0 + scale * (1 - 2 ** (-n / 12));
const mid = (n, x0, scale) => (fretX(n - 1, x0, scale) + fretX(n, x0, scale)) / 2;

// ---------------------------------------------------------------- portada: mástil con la pentatónica
// La menor pentatónica en las posiciones 1 (llena) y 2 (contorno): ver una figura y la que sigue.
const POS1 = [[6, 5, 1], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7, 1], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5, 1], [1, 8]];
const POS2 = [[6, 10], [5, 10], [4, 10], [3, 9], [2, 10], [1, 10]];
export function heroNeck() {
  const x0 = 34, scale = 1640, top = 30, h = 160, frets = 15;
  const sy = (s) => top + 18 + (s - 1) * ((h - 36) / 5); // cuerda 1 arriba, 6 abajo (vista del guitarrista)
  const fx = Array.from({ length: frets + 1 }, (_, n) => fretX(n, x0, scale));
  const end = fx[frets] + 34;
  let b = `<defs>
    <linearGradient id="hnWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WOOD}"/><stop offset=".5" stop-color="#523a2e"/><stop offset="1" stop-color="${WOOD2}"/></linearGradient>
    <linearGradient id="hnFade" x1="0" y1="0" x2="1" y2="0"><stop offset=".86" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="hnMask"><rect x="0" y="0" width="${end}" height="220" fill="url(#hnFade)"/></mask>
  </defs><g mask="url(#hnMask)">`;
  b += `<rect x="${x0}" y="${top}" width="${end - x0}" height="${h}" rx="3" fill="url(#hnWood)"/>`;
  b += `<rect x="${x0}" y="${top}" width="${end - x0}" height="3" fill="#fff" opacity=".07"/>`;
  // marcadores de posición (inlays)
  [3, 5, 7, 9, 15].forEach((n) => { b += `<circle cx="${mid(n, x0, scale)}" cy="${top + h / 2}" r="7" fill="${BONE}" opacity=".85"/>`; });
  b += `<circle cx="${mid(12, x0, scale)}" cy="${top + h / 2 - 34}" r="7" fill="${BONE}" opacity=".85"/><circle cx="${mid(12, x0, scale)}" cy="${top + h / 2 + 34}" r="7" fill="${BONE}" opacity=".85"/>`;
  // cejuela y trastes
  b += `<rect x="${x0 - 12}" y="${top - 4}" width="12" height="${h + 8}" rx="2" fill="${BONE}"/>`;
  fx.slice(1).forEach((x) => { b += `<rect x="${x - 2}" y="${top}" width="4" height="${h}" fill="${FRET}"/><rect x="${x - 2}" y="${top}" width="1.4" height="${h}" fill="#fff" opacity=".6"/>`; });
  // cuerdas (las graves más gruesas)
  for (let s = 1; s <= 6; s++) {
    const w = 1 + s * 0.45;
    b += `<rect x="${x0 - 12}" y="${sy(s) - w / 2 + 1.2}" width="${end}" height="${w}" fill="#000" opacity=".25"/><rect x="${x0 - 12}" y="${sy(s) - w / 2}" width="${end}" height="${w}" fill="${STR}"/>`;
  }
  b += '</g>';
  // notas: posición 2 en contorno, posición 1 llena; la tónica en rojo como en el libro
  POS2.forEach(([s, f], i) => { b += `<circle class="hn-ghost" style="--d:${1.5 + i * 0.05}s" cx="${mid(f, x0, scale)}" cy="${sy(s)}" r="10" fill="none" stroke="${BONE}" stroke-width="2.2" stroke-dasharray="3 3"/>`; });
  POS1.forEach(([s, f, r], i) => {
    b += `<g class="hn-dot" style="--d:${0.25 + i * 0.08}s"><circle cx="${mid(f, x0, scale)}" cy="${sy(s) + 1.5}" r="11.5" fill="#000" opacity=".3"/><circle cx="${mid(f, x0, scale)}" cy="${sy(s)}" r="11.5" fill="${r ? ROOT : '#fff'}"/>${r ? '' : `<circle cx="${mid(f, x0, scale)}" cy="${sy(s)}" r="4" fill="${INK}"/>`}</g>`;
  });
  return svg(`0 0 ${end + 4} 220`, b, 'ill-hero');
}

// ---------------------------------------------------------------- capítulos (160 x 120)
const tile = (id) => `<rect width="160" height="120" rx="18" fill="${TINT[id][1]}"/>`;

// Un trozo de mástil horizontal con 4 trastes para las miniaturas
function miniNeck(x, y, w, h, frets = 4) {
  let b = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${WOOD}"/><rect x="${x - 5}" y="${y - 2}" width="6" height="${h + 4}" rx="1.5" fill="${BONE}"/>`;
  for (let i = 1; i <= frets; i++) b += `<rect x="${x + (w / frets) * i - 1.2}" y="${y}" width="2.4" height="${h}" fill="${FRET}"/>`;
  for (let s = 0; s < 6; s++) b += `<rect x="${x - 5}" y="${y + 5 + s * ((h - 10) / 5) - 0.5}" width="${w + 5}" height="${0.8 + s * 0.25}" fill="${STR}"/>`;
  return b;
}
const neckDot = (x, y, w, h, frets, s, f, fill = '#fff', inner = INK) => {
  const cx = x + (w / frets) * (f - 0.5);
  const cy = y + 5 + (s - 1) * ((h - 10) / 5);
  return `<circle cx="${cx}" cy="${cy}" r="5.2" fill="${fill}"/>${inner ? `<circle cx="${cx}" cy="${cy}" r="1.8" fill="${inner}"/>` : ''}`;
};

const CH = {
  // Pentatónica: la figura de caja, dos notas por cuerda, tónica en rojo
  pentatonica() {
    const [x, y, w, h, n] = [28, 30, 112, 62, 4];
    let b = tile('pentatonica') + miniNeck(x, y, w, h, n);
    [[1, 1, 1], [1, 4], [2, 1], [2, 4], [3, 1], [3, 3], [4, 1], [4, 3, 1], [5, 1], [5, 3], [6, 1, 1], [6, 4]].forEach(([s, f, r]) => { b += neckDot(x, y, w, h, n, s, f, r ? ROOT : '#fff', r ? null : INK); });
    return b;
  },
  // Acordes: diagrama vertical de un acorde y el arpegio que sale de él
  acordes() {
    const c = TINT.acordes[0];
    let b = tile('acordes');
    const gx = 34, gy = 26, sw = 14, fh = 18;
    b += `<rect x="${gx - 2}" y="${gy - 4}" width="${sw * 5 + 4}" height="5" rx="1.5" fill="${INK}"/>`;
    for (let i = 0; i < 6; i++) b += `<line x1="${gx + i * sw}" y1="${gy}" x2="${gx + i * sw}" y2="${gy + fh * 4}" stroke="${INK}" stroke-width="1.3"/>`;
    for (let j = 1; j <= 4; j++) b += `<line x1="${gx}" y1="${gy + j * fh}" x2="${gx + sw * 5}" y2="${gy + j * fh}" stroke="${INK}" stroke-width="1.3"/>`;
    const pts = [[1, 3, 1], [2, 2], [4, 1]]; // cuerdas 5, 4 y 2 (índice desde la 6ta = 0)
    pts.forEach(([si, f, r]) => { b += `<circle cx="${gx + si * sw}" cy="${gy + fh * (f - 0.5)}" r="5.6" fill="${r ? ROOT : INK}"/>`; });
    [3, 5].forEach((si) => { b += `<circle cx="${gx + si * sw}" cy="${gy - 11}" r="3.6" fill="none" stroke="${INK}" stroke-width="1.4"/>`; });
    b += `<path d="M${gx - 6} ${gy - 15} l7 7 M${gx + 1} ${gy - 15} l-7 7" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
    // el arpegio: las mismas notas una tras otra, subiendo
    const ax = 118;
    [[ax, 92, 1], [ax + 10, 74], [ax + 20, 56], [ax + 30, 38]].forEach(([px, py, r], i, arr) => {
      if (i) b += `<line x1="${arr[i - 1][0]}" y1="${arr[i - 1][1]}" x2="${px}" y2="${py}" stroke="${c}" stroke-width="2" stroke-dasharray="3 3"/>`;
    });
    [[ax, 92, 1], [ax + 10, 74], [ax + 20, 56], [ax + 30, 38]].forEach(([px, py, r]) => { b += `<circle cx="${px}" cy="${py}" r="6" fill="${r ? ROOT : c}"/>`; });
    return b;
  },
  // Sistema tonal: la boca de la guitarra como círculo de quintas, con I, IV y V marcados
  tonal() {
    const c = TINT.tonal[0];
    let b = tile('tonal');
    const cx = 80, cy = 60, R = 40;
    b += `<circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="none" stroke="${WOOD}" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${R + 2}" fill="none" stroke="${WOOD}" stroke-width="1.5" stroke-dasharray="2 3"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="${R - 9}" fill="${INK}"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * (R - 3), y = cy + Math.sin(a) * (R - 3);
      const on = i === 0 || i === 1 || i === 11;
      b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 5.5 : 3}" fill="${i === 0 ? c : on ? '#fff' : '#bdb6ab'}" ${on && i ? `stroke="${c}" stroke-width="2"` : ''}/>`;
    }
    // flecha V → I
    const a1 = (1 / 12) * Math.PI * 2 - Math.PI / 2, a0 = -Math.PI / 2 + 0.16;
    b += `<path d="M${(cx + Math.cos(a1) * (R - 14)).toFixed(1)} ${(cy + Math.sin(a1) * (R - 14)).toFixed(1)} Q${cx + 6} ${cy - 22} ${(cx + Math.cos(a0) * (R - 14)).toFixed(1)} ${(cy + Math.sin(a0) * (R - 14)).toFixed(1)}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    return b;
  },
  // Modos: siete barras del más brillante (lidio) al más oscuro (locrio)
  modos() {
    const cols = ['#8E4CC0', '#CE3468', '#E07A1F', '#2C6DB5', '#14A0A8', '#2E9A5F', '#7A5536'];
    let b = tile('modos');
    cols.forEach((col, i) => {
      const hh = 70 - i * 7.5;
      b += `<rect x="${26 + i * 16}" y="${96 - hh}" width="11" height="${hh}" rx="5.5" fill="${col}"/><circle cx="${31.5 + i * 16}" cy="${96 - hh - 8}" r="2.6" fill="${col}" opacity="${1 - i * 0.11}"/>`;
    });
    b += `<line x1="20" y1="100" x2="140" y2="100" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
    return b;
  },
  // Técnica: púa y metrónomo
  tecnica() {
    const c = TINT.tecnica[0];
    let b = tile('tecnica');
    b += `<path d="M40 30 C58 24 82 26 88 40 C92 52 72 84 62 92 C56 96 52 94 48 86 C40 70 28 50 30 40 C31 34 35 32 40 30 Z" fill="${c}"/>`;
    b += `<path d="M44 38 C56 34 72 35 76 43" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`;
    b += `<path d="M104 26 L120 26 L134 96 L90 96 Z" fill="${WOOD}"/><rect x="88" y="94" width="48" height="6" rx="2" fill="${WOOD2}"/>`;
    b += `<path d="M112 32 L112 86" stroke="${BONE}" stroke-width="1" opacity=".4"/>`;
    b += `<g class="ill-swing"><line x1="112" y1="86" x2="124" y2="40" stroke="${BONE}" stroke-width="2.4" stroke-linecap="round"/><rect x="117.5" y="52" width="8" height="7" rx="1.5" fill="${BONE}" transform="rotate(14 121.5 55.5)"/></g>`;
    b += `<circle cx="112" cy="86" r="3" fill="${BONE}"/>`;
    return b;
  },
  // Extensiones: torre de terceras; la de arriba es la tensión que se suma
  extensiones() {
    const c = TINT.extensiones[0];
    const cols = [INK, '#E07A1F', '#2C6DB5', '#2E9A5F'];
    let b = tile('extensiones');
    cols.forEach((col, i) => { b += `<rect x="46" y="${92 - i * 18}" width="68" height="13" rx="6.5" fill="${col}"/>`; });
    b += `<rect x="46" y="${92 - 4 * 18}" width="68" height="13" rx="6.5" fill="${c}"/><rect x="40" y="${92 - 4 * 18 - 5}" width="80" height="23" rx="11.5" fill="none" stroke="${c}" stroke-width="1.8" stroke-dasharray="4 3"/>`;
    b += `<path d="M126 88 L126 34 M121 40 L126 33 L131 40" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    return b;
  },
  // Trabajo final: amplificador con el cable y una luz de escenario
  final() {
    const c = TINT.final[0];
    let b = tile('final');
    b += `<path d="M30 0 L62 0 L98 120 L4 120 Z" fill="#fff" opacity=".55"/>`;
    b += `<rect x="62" y="34" width="70" height="62" rx="6" fill="${INK}"/><rect x="62" y="34" width="70" height="14" rx="6" fill="${c}"/><rect x="62" y="44" width="70" height="4" fill="${c}"/>`;
    [74, 86, 98, 110].forEach((x) => { b += `<circle cx="${x}" cy="41" r="2.6" fill="${BONE}"/>`; });
    b += `<circle cx="122" cy="41" r="2" fill="#f4c542"/>`;
    b += `<circle cx="97" cy="72" r="18" fill="#2d2d33"/><circle cx="97" cy="72" r="11" fill="#3a3a42"/><circle cx="97" cy="72" r="4" fill="#55555f"/>`;
    b += `<rect x="66" y="96" width="8" height="5" rx="1.5" fill="${INK}"/><rect x="120" y="96" width="8" height="5" rx="1.5" fill="${INK}"/>`;
    b += `<path d="M66 60 C46 62 46 92 30 96 C20 99 16 108 22 114" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    b += `<rect x="62" y="57" width="6" height="7" rx="1.5" fill="${FRET}"/>`;
    return b;
  },
};

export const chapterIllus = (id, cls = '') => (CH[id] ? svg('0 0 160 120', CH[id](), cls) : '');
