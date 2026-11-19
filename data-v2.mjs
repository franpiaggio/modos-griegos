// Escala mayor de Do en 7 posiciones, transcripta del modelo "Posición Escala Mayor".
// Notas: [cuerda (1 = Mi aguda, 6 = Mi grave), traste, dedo]. `start` = traste de la primera casilla.
export const MAJOR7 = [
  { start: 1, notes: [
    [1, 1, 1], [1, 3, 2], [1, 5, 4],
    [2, 3, 2], [2, 5, 4],
    [3, 2, 1], [3, 4, 3], [3, 5, 4],
    [4, 2, 1], [4, 3, 2], [4, 5, 4],
    [5, 2, 1], [5, 3, 2], [5, 5, 4],
    [6, 1, 1], [6, 3, 2], [6, 5, 4]] },
  { start: 3, notes: [
    [1, 3, 1], [1, 5, 2], [1, 7, 4],
    [2, 5, 2], [2, 6, 3],
    [3, 4, 1], [3, 5, 2], [3, 7, 4],
    [4, 3, 1], [4, 5, 2], [4, 7, 4],
    [5, 3, 1], [5, 5, 2], [5, 7, 4],
    [6, 3, 1], [6, 5, 2], [6, 7, 4]] },
  { start: 5, notes: [
    [1, 5, 1], [1, 7, 3], [1, 8, 4],
    [2, 5, 1], [2, 6, 2], [2, 8, 4],
    [3, 5, 1], [3, 7, 3],
    [4, 5, 1], [4, 7, 3], [4, 9, 4],
    [5, 5, 1], [5, 7, 3], [5, 8, 4],
    [6, 5, 1], [6, 7, 3], [6, 8, 4]] },
  { start: 7, notes: [
    [1, 7, 1], [1, 8, 2], [1, 10, 4],
    [2, 8, 2], [2, 10, 4],
    [3, 7, 1], [3, 9, 3], [3, 10, 4],
    [4, 7, 1], [4, 9, 3], [4, 10, 4],
    [5, 7, 1], [5, 8, 2], [5, 10, 4],
    [6, 7, 1], [6, 8, 2], [6, 10, 4]] },
  { start: 8, notes: [
    [1, 8, 1], [1, 10, 2], [1, 12, 4],
    [2, 10, 2], [2, 12, 4],
    [3, 9, 1], [3, 10, 2], [3, 12, 4],
    [4, 9, 1], [4, 10, 2], [4, 12, 4],
    [5, 8, 1], [5, 10, 2], [5, 12, 4],
    [6, 8, 1], [6, 10, 2], [6, 12, 4]] },
  { start: 10, notes: [
    [1, 10, 1], [1, 12, 3], [1, 13, 4],
    [2, 10, 1], [2, 12, 3], [2, 13, 4],
    [3, 10, 1], [3, 12, 3],
    [4, 10, 1], [4, 12, 2], [4, 14, 4],
    [5, 10, 1], [5, 12, 3], [5, 14, 4],
    [6, 10, 1], [6, 12, 3], [6, 13, 4]] },
  { start: 12, notes: [
    [1, 12, 1], [1, 13, 2], [1, 15, 4],
    [2, 12, 1], [2, 13, 2], [2, 15, 4],
    [3, 12, 1], [3, 14, 3],
    [4, 12, 1], [4, 14, 3], [4, 15, 4],
    [5, 12, 1], [5, 14, 3], [5, 15, 4],
    [6, 12, 1], [6, 13, 2], [6, 15, 4]] },
];

// Los 7 modos de Do mayor. `color` se usa solo en la variante "un color por modo".
export const MODES = [
  { id: 'jonico', name: 'Jónico', note: 'C', nombre: 'Do', color: '#CE3468' },
  { id: 'dorico', name: 'Dórico', note: 'D', nombre: 'Re', color: '#2C6DB5' },
  { id: 'frigio', name: 'Frigio', note: 'E', nombre: 'Mi', color: '#2E9A5F' },
  { id: 'lidio', name: 'Lidio', note: 'F', nombre: 'Fa', color: '#8E4CC0' },
  { id: 'mixolidio', name: 'Mixolidio', note: 'G', nombre: 'Sol', color: '#E07A1F' },
  { id: 'eolico', name: 'Eólico', note: 'A', nombre: 'La', color: '#14A0A8' },
  { id: 'locrio', name: 'Locrio', note: 'B', nombre: 'Si', color: '#7A5536' },
];
