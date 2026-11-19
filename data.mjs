// Datos de las páginas. Notas: [cuerda (1 = Mi aguda, 6 = Mi grave), traste, dedo].
// `start` = traste de la primera casilla visible del diagrama.
// Las etiquetas romanas usan la posición medida en el original (x absoluto, dy respecto de la cuerda 1).

const LABELS = [
  [{ t: 'II', x: 248.2, dy: -9.4 }, { t: 'V', x: 622.6, dy: -11.6 }],
  [{ t: 'V', x: 113.0, dy: -7.1 }, { t: 'VIII', x: 498.8, dy: -12.3 }],
  [{ t: 'VII', x: 112.8, dy: -8.1 }, { t: 'X', x: 498.8, dy: -11.6 }],
  [{ t: 'X', x: 250.5, dy: -11.8 }, { t: 'XII', x: 502.8, dy: -11.8 }],
  [{ t: 'XII', x: 122.5, dy: -11.6 }, { t: 'XV', x: 500.5, dy: -11.8 }],
];
const STARTS = [1, 5, 7, 9, 12];

const withLayout = (positions) => positions.map((notes, i) => ({ start: STARTS[i], labels: LABELS[i], notes }));

// Pentatónica de Do mayor / La menor (página original, como referencia de formato)
const PENTATONIC = withLayout([
  [[1, 3, 2], [1, 5, 4], [2, 3, 2], [2, 5, 4], [3, 2, 1], [3, 5, 4], [4, 2, 1], [4, 5, 4], [5, 3, 2], [5, 5, 4], [6, 3, 2], [6, 5, 4]],
  [[1, 5, 1], [1, 8, 4], [2, 5, 1], [2, 8, 4], [3, 5, 1], [3, 7, 3], [4, 5, 1], [4, 7, 3], [5, 5, 1], [5, 7, 3], [6, 5, 1], [6, 8, 4]],
  [[1, 8, 2], [1, 10, 4], [2, 8, 2], [2, 10, 4], [3, 7, 1], [3, 9, 3], [4, 7, 1], [4, 10, 4], [5, 7, 1], [5, 10, 4], [6, 8, 2], [6, 10, 4]],
  [[1, 10, 1], [1, 12, 3], [2, 10, 1], [2, 13, 4], [3, 9, 1], [3, 12, 3], [4, 10, 1], [4, 12, 3], [5, 10, 1], [5, 12, 3], [6, 10, 1], [6, 12, 3]],
  [[1, 12, 1], [1, 15, 4], [2, 13, 2], [2, 15, 4], [3, 12, 1], [3, 14, 3], [4, 12, 1], [4, 14, 3], [5, 12, 1], [5, 15, 4], [6, 12, 1], [6, 15, 4]],
]);

// Escala mayor de Do (las 7 notas) en las mismas 5 zonas del mástil.
// Contiene completas las figuras pentatónicas; se agregan Fa y Si.
const MAJOR = withLayout([
  // Posición I (trastes 1-5)
  [[1, 1, 1], [1, 3, 2], [1, 5, 4], [2, 3, 2], [2, 5, 4], [3, 2, 1], [3, 4, 3], [3, 5, 4],
   [4, 2, 1], [4, 3, 2], [4, 5, 4], [5, 2, 1], [5, 3, 2], [5, 5, 4], [6, 1, 1], [6, 3, 2], [6, 5, 4]],
  // Posición V (trastes 5-9)
  [[1, 5, 1], [1, 7, 3], [1, 8, 4], [2, 5, 1], [2, 6, 2], [2, 8, 4], [3, 5, 1], [3, 7, 3],
   [4, 5, 1], [4, 7, 3], [4, 9, 4], [5, 5, 1], [5, 7, 3], [5, 8, 4], [6, 5, 1], [6, 7, 3], [6, 8, 4]],
  // Posición VII (trastes 7-10)
  [[1, 7, 1], [1, 8, 2], [1, 10, 4], [2, 8, 2], [2, 10, 4], [3, 7, 1], [3, 9, 3], [3, 10, 4],
   [4, 7, 1], [4, 9, 3], [4, 10, 4], [5, 7, 1], [5, 8, 2], [5, 10, 4], [6, 7, 1], [6, 8, 2], [6, 10, 4]],
  // Posición IX/X (trastes 9-13)
  [[1, 10, 1], [1, 12, 3], [1, 13, 4], [2, 10, 1], [2, 12, 3], [2, 13, 4], [3, 9, 1], [3, 10, 2], [3, 12, 4],
   [4, 9, 1], [4, 10, 2], [4, 12, 4], [5, 10, 1], [5, 12, 3], [6, 10, 1], [6, 12, 3], [6, 13, 4]],
  // Posición XII (trastes 12-15)
  [[1, 12, 1], [1, 13, 2], [1, 15, 4], [2, 12, 1], [2, 13, 2], [2, 15, 4], [3, 12, 1], [3, 14, 3],
   [4, 12, 1], [4, 14, 3], [4, 15, 4], [5, 12, 1], [5, 14, 3], [5, 15, 4], [6, 12, 1], [6, 13, 2], [6, 15, 4]],
]);

// Los 7 modos de Do mayor: mismas figuras, cambia la tónica resaltada.
// Círculo rojo = tónica del modo. Cuadrado naranja = tónica de la escala mayor de origen (Do).
const MODES = [
  ['jonico', 'Jónico', 'C', 'Do'],
  ['dorico', 'Dórico', 'D', 'Re'],
  ['frigio', 'Frigio', 'E', 'Mi'],
  ['lidio', 'Lidio', 'F', 'Fa'],
  ['mixolidio', 'Mixolidio', 'G', 'Sol'],
  ['eolico', 'Eólico', 'A', 'La'],
  ['locrio', 'Locrio', 'B', 'Si'],
];

export const PAGES = [
  {
    id: 'pentatonica',
    nav: 'Pentatónica',
    title: ['Posición', 'Pentatónica'],
    circle: 'C',
    square: 'A',
    legend: [{ kind: 'major', text: 'Tónica mayor' }, { kind: 'minor', text: 'Tónica menor' }],
    legendFixed: true,
    positions: PENTATONIC,
  },
  ...MODES.map(([id, name, note, nombre]) => ({
    id,
    nav: name,
    title: ['Modo', name],
    circle: note,
    square: note === 'C' ? null : 'C',
    legend: note === 'C'
      ? [{ kind: 'major', text: `Tónica ${nombre}` }]
      : [{ kind: 'major', text: `Tónica ${nombre}` }, { kind: 'minor', text: 'Tónica Do mayor' }],
    positions: MAJOR,
  })),
];
