// Catálogo de ejercicios técnicos por mano y objetivo.
// mano: 'izq' | 'der' | 'ambas'. obj: velocidad, igualdad, dinamica, apagado, precision.
// start/target en bpm (pulso = negra); sub = notas por pulso; reps = repeticiones limpias para subir el tempo.

export const MANOS = [['todas', 'Todas'], ['izq', 'Mano izquierda'], ['der', 'Mano derecha'], ['ambas', 'Sincronía']];
export const OBJETIVOS = [
  ['todos', 'Todos'],
  ['velocidad', 'Velocidad'],
  ['igualdad', 'Igualdad'],
  ['dinamica', 'Dinámica'],
  ['apagado', 'Apagado'],
  ['precision', 'Precisión'],
];
export const OBJ_NAME = { velocidad: 'Velocidad', igualdad: 'Igualdad', dinamica: 'Dinámica', apagado: 'Apagado', precision: 'Precisión' };
export const MANO_NAME = { izq: 'Mano izquierda', der: 'Mano derecha', ambas: 'Sincronía de manos' };

// Permutaciones de 4 dedos para el cromático (en trastes 1 a 4 de cada cuerda)
const PERMS = ['1234', '4321', '1324', '1432', '2413', '3142'];
function chromatic(perm) {
  const strings = [6, 5, 4, 3, 2, 1];
  const picks = ['D', 'U'];
  let k = 0;
  return strings.map((s) => [...perm].map((d) => `${s}-${Number(d) + 4}${picks[k++ % 2]}`).join(' ')).join(' | ');
}

export const EXERCISES = [
  {
    id: 'arana', name: 'Cromático 1-2-3-4 (araña)', mano: 'ambas', obj: ['velocidad', 'igualdad'], start: 60, target: 120, sub: 4,
    variants: PERMS.map((p) => ({ id: p, label: p, tab: chromatic(p) })),
    desc: 'Un dedo por traste (trastes 5 a 8) en las 6 cuerdas, con púa alternada. Base de la coordinación entre las dos manos.',
    steps: ['Ubicá la mano en el traste V: dedo 1 en el 5, dedo 4 en el 8.', 'Púa alternada estricta (abajo-arriba) aunque cambies de cuerda.', 'Dejá apoyados los dedos que ya tocaste mientras subís (ascendente).', 'Cuando salga limpio, probá otras permutaciones.'],
    criteria: ['Todas las notas suenan con el mismo volumen', 'Ninguna nota se corta antes de tiempo', 'Los dedos quedan cerca del diapasón', 'La púa no hace movimientos grandes'],
  },
  {
    id: 'independencia', name: 'Independencia de dedos 1-3 / 2-4', mano: 'izq', obj: ['precision', 'igualdad'], start: 50, target: 100, sub: 2,
    tab: '6-5 5-7 6-6 5-8 | 5-5 4-7 5-6 4-8 | 4-5 3-7 4-6 3-8 | 3-5 2-8 3-6 2-9 | 2-5 1-7 2-6 1-8',
    desc: 'Pares de dedos en cuerdas vecinas (1 y 3, luego 2 y 4). Trabaja el control de cada dedo por separado.',
    steps: ['Dedo 1 en la cuerda grave, dedo 3 en la siguiente; luego 2 y 4.', 'Levantá cada dedo solo lo justo.', 'Empezá muy lento: el objetivo es la precisión, no la velocidad.'],
    criteria: ['Cada nota suena clara (sin trastear)', 'Los dedos que no tocan no se alejan del diapasón', 'Sin tensión en el pulgar ni en la muñeca'],
  },
  {
    id: 'estiramiento', name: 'Estiramientos (apertura de mano)', mano: 'izq', obj: ['precision'], start: 50, target: 90, sub: 2,
    tab: '6-12 6-14 6-15 6-17 | 5-12 5-14 5-15 5-17 | 4-12 4-14 4-15 4-17 | 3-11 3-13 3-14 3-16 | 2-12 2-14 2-15 2-17 | 1-12 1-14 1-15 1-17',
    desc: 'Cuatro dedos repartidos en 6 trastes. Empezá arriba del mástil (trastes más chicos) y bajá de a un traste cuando no duela.',
    steps: ['Pulgar detrás del mástil, a la altura del dedo 2.', 'No fuerces: si molesta, subí al traste anterior.', 'Cada semana bajá un traste la posición.'],
    criteria: ['Las 4 notas suenan sin trastear', 'Ningún dolor en la muñeca o el pulgar', 'La mano vuelve a relajarse entre repeticiones'],
  },
  {
    id: 'ligado-asc', name: 'Ligados ascendentes (hammer-on)', mano: 'izq', obj: ['igualdad', 'velocidad'], start: 50, target: 110, sub: 3,
    tab: '6-5D h6-7 h6-8 | 5-5D h5-7 h5-8 | 4-5D h4-7 h4-9 | 3-5D h3-7 h3-9 | 2-6D h2-8 h2-10 | 1-7D h1-8 h1-10',
    desc: 'Pulsás solo la primera nota de cada cuerda; las otras salen con el golpe del dedo (martilleo).',
    steps: ['Golpeá con la yema, justo detrás del traste.', 'Las notas ligadas tienen que sonar igual de fuerte que la pulsada.', 'Usá la mano derecha para apagar las cuerdas graves.'],
    criteria: ['Las 3 notas con el mismo volumen', 'Ritmo parejo (tresillos exactos)', 'No suenan otras cuerdas'],
  },
  {
    id: 'ligado-desc', name: 'Ligados descendentes (pull-off)', mano: 'izq', obj: ['igualdad', 'velocidad'], start: 50, target: 110, sub: 3,
    tab: '1-10D p1-8 p1-7 | 2-10D p2-8 p2-6 | 3-9D p3-7 p3-5 | 4-9D p4-7 p4-5 | 5-8D p5-7 p5-5 | 6-8D p6-7 p6-5',
    desc: 'Pulsás la primera nota y las siguientes salen tirando la cuerda hacia abajo con el dedo que se levanta.',
    steps: ['Dejá preparados los dedos de las notas siguientes antes de pulsar.', 'Tirá la cuerda levemente hacia el piso, no solo levantes el dedo.', 'Cuidá no hacer sonar la cuerda de abajo.'],
    criteria: ['Sin pérdida de volumen en la 2da y 3ra nota', 'Ritmo parejo', 'Sin ruidos de otras cuerdas'],
  },
  {
    id: 'trinos', name: 'Trinos (resistencia)', mano: 'izq', obj: ['velocidad', 'igualdad'], start: 60, target: 140, sub: 4,
    tab: '3-5D h3-7 p3-5 h3-7 p3-5 h3-7 p3-5 h3-7 | 3-5D h3-8 p3-5 h3-8 p3-5 h3-8 p3-5 h3-8 | 3-6 h3-8 p3-6 h3-8 p3-6 h3-8 p3-6 h3-8',
    desc: 'Ligados rápidos entre dos dedos, sin volver a pulsar. Probá las combinaciones 1-3, 1-4 y 2-4.',
    steps: ['Pulsá solo la primera nota de cada compás.', 'Mantené el trino 30 segundos sin parar.', 'Si se cansa la mano, pará y sacudila.'],
    criteria: ['El sonido no se apaga a lo largo del compás', 'Ritmo constante (semicorcheas)', 'Sin tensión en el antebrazo'],
  },
  {
    id: 'slides', name: 'Deslizamientos (slides)', mano: 'izq', obj: ['precision'], start: 50, target: 100, sub: 2,
    tab: '3-5D /3-7 /3-9 \\3-7 | 2-5D /2-7 /2-8 \\2-7 | 1-5D /1-7 /1-8 \\1-7 | 1-5D \\1-3 /1-5 /1-7',
    desc: 'Pulsás una nota y llegás a la siguiente deslizando el mismo dedo, sin volver a pulsar.',
    steps: ['Mantené la presión mientras deslizás para que no se corte el sonido.', 'Frená exactamente en el traste de llegada.', 'Primero con el dedo 1, después con el 3.'],
    criteria: ['Llegás afinado al traste de destino', 'El sonido no se corta en el camino', 'Sin pasarte ni quedarte corto'],
  },
  {
    id: 'bends', name: 'Bends con afinación objetivo', mano: 'izq', obj: ['precision'], start: 50, target: 80, sub: 1,
    tab: '2-10 b2-8(10) | 2-10 b2-8(10) | 3-9 b3-7(9) | 3-9 b3-7(9) | 2-9 b2-8(9) | 1-10 b1-8(10)',
    desc: 'Tocás la nota de referencia y después subís la cuerda (bend) hasta igualar esa altura: tono entero y medio tono.',
    steps: ['Empujá con 2 o 3 dedos juntos (el 3ro ayudado por el 2do y el 1ro).', 'El giro sale de la muñeca, no solo de los dedos.', 'Escuchá la referencia y compará.'],
    criteria: ['La nota llega a la altura exacta (ni más ni menos)', 'El bend se mantiene estable', 'Las otras cuerdas no suenan'],
  },
  {
    id: 'vibrato', name: 'Vibrato controlado', mano: 'izq', obj: ['precision', 'igualdad'], start: 60, target: 80, sub: 1,
    tab: '2-8~ 2-8~ | 3-7~ 3-7~ | 1-5~ 1-5~ | 2-10~ 2-10~',
    desc: 'Una nota larga con oscilación regular. Probá un vibrato por corchea y después uno por tresillo, con el metrónomo.',
    steps: ['El movimiento sale de la muñeca, como girando una llave.', 'La oscilación tiene que coincidir con el pulso o su subdivisión.', 'Probá ancho chico (sutil) y ancho grande (medio tono).'],
    criteria: ['Oscilación regular (siempre igual de ancha)', 'Vuelve siempre a la altura de la nota', 'En tiempo con el metrónomo'],
  },
  {
    id: 'alternada', name: 'Púa alternada en una cuerda', mano: 'der', obj: ['velocidad', 'igualdad'], start: 60, target: 140, sub: 4,
    tab: '1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U | 1-8D 1-10U 1-12D 1-10U 1-8D 1-10U 1-12D 1-10U | 2-5D 2-6U 2-8D 2-6U 2-5D 2-6U 2-8D 2-6U',
    desc: 'Abajo-arriba estricto sobre una sola cuerda. Es la base de la velocidad con púa.',
    steps: ['Movimiento chico desde la muñeca, no desde el codo.', 'Apoyá suavemente el canto de la mano en el puente si te ayuda.', 'Acentuá el primer tiempo de cada grupo de 4.'],
    criteria: ['Los golpes hacia abajo y hacia arriba suenan iguales', 'Semicorcheas parejas', 'La púa sale poco de la cuerda'],
  },
  {
    id: 'cruce', name: 'Cruce de cuerdas (inside / outside)', mano: 'der', obj: ['precision', 'velocidad'], start: 60, target: 120, sub: 4,
    tab: '!inside 2-5U 1-5D 2-8U 1-8D 2-5U 1-5D 2-8U 1-8D | !outside 2-5D 1-5U 2-8D 1-8U 2-5D 1-5U 2-8D 1-8U | 3-5D 2-5U 3-7D 2-6U 3-5D 2-5U 3-7D 2-6U',
    desc: 'Una nota por cuerda alternando dos cuerdas. Inside: la púa cambia de cuerda por "dentro" del par; outside: por "fuera".',
    steps: ['Inside: arriba en la cuerda grave, abajo en la aguda.', 'Outside: abajo en la grave, arriba en la aguda (cuesta más: hay que saltar la cuerda).', 'Practicá los dos hasta que suenen igual.'],
    criteria: ['No se escuchan roces de la cuerda que se saltea', 'Mismo volumen en las dos cuerdas', 'Ritmo constante en el cambio'],
  },
  {
    id: 'saltos', name: 'Saltos de cuerda', mano: 'der', obj: ['precision', 'apagado'], start: 50, target: 110, sub: 2,
    tab: '6-5D 6-8U 4-5D 4-7U | 5-5D 5-7U 3-5D 3-7U | 4-5D 4-7U 2-5D 2-8U | 3-5D 3-7U 1-5D 1-8U',
    desc: 'Pentatónica tocada salteando una cuerda: obliga a la púa a viajar con precisión.',
    steps: ['Mantené la púa cerca de las cuerdas al saltar.', 'La cuerda que salteás tiene que quedar en silencio.', 'Mirá menos la mano derecha a medida que sale.'],
    criteria: ['La cuerda del medio no suena', 'Llegada exacta a la cuerda destino', 'Mismo volumen en las dos cuerdas'],
  },
  {
    id: 'economy', name: 'Economy picking (3 notas por cuerda)', mano: 'der', obj: ['velocidad'], start: 60, target: 130, sub: 3,
    tab: '6-5D 6-7U 6-8D 5-5D 5-7U 5-8D | 4-5D 4-7U 4-9D 3-5D 3-7U 3-9D | 2-6D 2-8U 2-10D 1-7D 1-8U 1-10D',
    desc: 'Púa alternada, pero al cambiar de cuerda en la misma dirección se "barre": dos golpes seguidos hacia abajo.',
    steps: ['Fijate en las marcas: después de la 3ra nota de cada cuerda vienen dos golpes hacia abajo.', 'El barrido es un solo movimiento que atraviesa dos cuerdas.', 'Descendente: se barre hacia arriba.'],
    criteria: ['Las notas no se superponen', 'El barrido no adelanta el ritmo', 'Tresillos parejos'],
  },
  {
    id: 'sweep', name: 'Sweep en 3 cuerdas', mano: 'ambas', obj: ['apagado', 'velocidad'], start: 50, target: 120, sub: 3,
    tab: '3-14D 2-13D 1-12D 2-13U 3-14U 2-13D | 3-9D 2-10D 1-8D 2-10U 3-9U 2-10D | 3-10D 2-10D 1-10D 2-10U 3-10U 2-10D',
    desc: 'Arpegios barridos (Lam, Sol, Mi/La) con un único movimiento de púa por dirección.',
    steps: ['La púa "cae" de cuerda en cuerda en un solo movimiento.', 'La izquierda levanta cada dedo apenas suena su nota (para que no suenen juntas).', 'Empezá muy lento: el apagado es lo difícil.'],
    criteria: ['Cada nota suena sola (no como acorde)', 'Movimiento continuo de la púa', 'Ritmo parejo de tresillos'],
  },
  {
    id: 'tremolo', name: 'Trémolo', mano: 'der', obj: ['velocidad', 'igualdad'], start: 70, target: 160, sub: 4,
    tab: '1-12D 1-12U 1-12D 1-12U 1-12D 1-12U 1-12D 1-12U | 1-10D 1-10U 1-10D 1-10U 1-8D 1-8U 1-8D 1-8U | 1-7D 1-7U 1-7D 1-7U 1-7D 1-7U 1-7D 1-7U',
    desc: 'Repetición rápida de una misma nota con púa alternada mientras la izquierda cambia de nota.',
    steps: ['Muñeca suelta; la púa toca apenas la cuerda.', 'Los cambios de nota caen siempre en el tiempo.', 'Subí de a poco: semicorcheas, después fusas.'],
    criteria: ['Sonido continuo, sin huecos', 'Golpes iguales arriba y abajo', 'Cambios de nota en tiempo'],
  },
  {
    id: 'palm', name: 'Palm muting', mano: 'der', obj: ['apagado', 'dinamica'], start: 70, target: 140, sub: 2,
    tab: '!PM [6-0,5-2]D [6-0,5-2]D [6-0,5-2]D [6-0,5-2]D !abierto [6-3,5-5]D [6-3,5-5]D | !PM [6-0,5-2]D [6-0,5-2]D [6-0,5-2]D [6-0,5-2]D !abierto [6-5,5-7]D [6-5,5-7]D',
    desc: 'El canto de la mano derecha apoya sobre las cuerdas junto al puente: sonido corto y percusivo. Alterná apagado y abierto.',
    steps: ['Apoyá el canto de la mano justo donde las cuerdas salen del puente.', 'Más adentro = más apagado. Buscá un punto donde se oiga la altura.', 'En las notas "abierto" levantá la mano sin perder el ritmo.'],
    criteria: ['Sonido apagado parejo en todas las notas', 'Se distingue la altura de la nota', 'El cambio a abierto no se atrasa'],
  },
  {
    id: 'dinamicas', name: 'Dinámicas pp → ff', mano: 'der', obj: ['dinamica'], start: 60, target: 100, sub: 2,
    tab: '!pp 4-7 3-5 3-7 2-5 !mf 4-7 3-5 3-7 2-5 | !f 4-7 3-5 3-7 2-5 !ff 4-7 3-5 3-7 2-5 | !ff 2-5 3-7 3-5 4-7 !f 2-5 3-7 3-5 4-7 | !mf 2-5 3-7 3-5 4-7 !pp 2-5 3-7 3-5 4-7',
    desc: 'La misma frase de pentatónica en 4 niveles de volumen, subiendo y bajando, sin cambiar el tempo.',
    steps: ['pp: casi sin ataque, púa apenas.', 'ff: fuerte pero sin que la nota desafine o trastee.', 'Probá también un crescendo continuo a lo largo de 4 compases.'],
    criteria: ['Se distinguen claramente los 4 niveles', 'El tempo no se acelera al subir el volumen', 'En ff no hay trasteo ni desafinación'],
  },
  {
    id: 'pima', name: 'Arpegio p-i-m-a (fingerstyle)', mano: 'der', obj: ['igualdad'], start: 50, target: 110, sub: 3,
    tab: '5-3p 3-0i 2-1m 1-0a 2-1m 3-0i | 6-3p 3-0i 2-0m 1-3a 2-0m 3-0i | 4-0p 3-2i 2-3m 1-2a 2-3m 3-2i | 5-0p 3-2i 2-1m 1-0a 2-1m 3-2i',
    desc: 'Pulgar (p) en los bajos; índice (i), medio (m) y anular (a) en las cuerdas 3, 2 y 1. Acordes Do, Sol, Re y Lam.',
    steps: ['Cada dedo se encarga de su cuerda.', 'El pulgar toca hacia afuera; los otros dedos hacia la palma.', 'Dejá que los acordes suenen (no apagues).'],
    criteria: ['El bajo un poco más fuerte que las notas agudas', 'Las 3 agudas con el mismo volumen', 'Tresillos parejos'],
  },
  {
    id: 'im', name: 'Alternancia i-m (apoyando)', mano: 'der', obj: ['igualdad', 'velocidad'], start: 60, target: 140, sub: 2,
    tab: '1-0i 1-1m 1-3i 1-5m 1-7i 1-8m 1-10i 1-12m | 1-12i 1-10m 1-8i 1-7m 1-5i 1-3m 1-1i 1-0m | 2-1i 2-3m 2-5i 2-6m 2-8i 2-10m 2-12i 2-13m',
    desc: 'Escala sobre una cuerda alternando índice y medio, con toque apoyado (el dedo descansa en la cuerda de al lado).',
    steps: ['Nunca repitas el mismo dedo dos veces seguidas.', 'Toque apoyado: después de pulsar, el dedo queda sobre la cuerda vecina.', 'Probá también m-i y a-m.'],
    criteria: ['Mismo volumen y timbre con i y con m', 'Alternancia estricta', 'Corcheas parejas'],
  },
  {
    id: 'apagado', name: 'Apagado de cuerdas (sin ruido)', mano: 'ambas', obj: ['apagado'], start: 50, target: 100, sub: 2,
    tab: '6-5D 5-7D 4-7D 3-7D 2-8D 1-5D 1-8U 2-5U | 3-7D 3-5U 4-7D 4-5U 5-7D 5-5U 6-8D 6-5U | 6-X 6-X 5-X 5-X 4-X 4-X 3-X 3-X',
    desc: 'Tocás una nota por vez y todas las demás cuerdas tienen que quedar en silencio. El último compás es solo ruido percusivo controlado.',
    steps: ['La palma derecha apaga las cuerdas más graves que la que tocás.', 'La yema/costado del dedo de la izquierda apaga las más agudas.', 'En las notas con × apoyá la izquierda sin presionar y rasgueá.'],
    criteria: ['Al parar, no queda sonando ninguna cuerda', 'No hay armónicos involuntarios', 'Las × suenan cortas y sin altura'],
  },
  {
    id: 'subdivisiones', name: 'Sincronía por subdivisiones', mano: 'ambas', obj: ['precision', 'velocidad'], start: 60, target: 100, sub: 1,
    tab: '@1 !negras 1-5D 1-7U 1-8D 1-7U | @2 !corcheas 1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U | @3 !tresillos 1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U | @4 !semicorcheas 1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U 1-5D 1-7U 1-8D 1-7U',
    desc: 'La misma figura en negras, corcheas, tresillos y semicorcheas sobre un pulso fijo: un compás de cada una, sin parar.',
    steps: ['El metrónomo marca solo el pulso (negras).', 'Contá en voz alta: "1, 1-y, 1-y-a, 1-e-y-a".', 'El cambio de subdivisión tiene que caer justo en el 1.'],
    criteria: ['Cada subdivisión entra exacta en el pulso', 'Los cambios no se adelantan ni se atrasan', 'Las dos manos sincronizadas (púa y dedo a la vez)'],
  },
];
