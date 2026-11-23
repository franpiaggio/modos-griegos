# v4: investigación y criterios

Este documento resume qué se investigó antes de armar la v4 y qué decisión se tomó en cada caso. Ningún contenido se armó "a criterio": cada uno sigue lo que hacen apps similares o una fuente de teoría reconocida.

## 1. Apps estudiadas y qué se tomó de cada una

| Patrón | Apps de referencia | Cómo quedó en la v4 |
|---|---|---|
| Separar la consulta (biblioteca) de la práctica (juegos o ejercicios) | Fretonomy (Scale Explorer frente a ~30 juegos); Guitar Pro (menú Tools) | Tres secciones: **Información**, **Teoría** y **Técnica** |
| Elegir tónica con 12 botones y la escala por familia | Guitar Pro, Fretonomy, Fretboard (Mankovsky) | Selector de tónica, segmento de familia y fila de variantes |
| Ver dedos, notas o intervalos y resaltar la tónica | Fretonomy, Fretboard, Fretionary | Configuración, compartida por todas las secciones |
| Mostrar la fórmula y las notas junto al diagrama | Guitar Pro (fórmula, semitonos y botón de reproducir) | Ficha (botón ⓘ) con fórmula, notas, acordes de la escala, uso y pentatónicas que contiene |
| Panel de ajustes por ejercicio: qué tipos, alteraciones y cantidad | teoria.com, musictheory.net / Tenuto | Ajustes por ejercicio, guardados en el navegador |
| Respuesta con teclado de letra + alteración; si es enarmónica, cuenta como error y se explica | teoria.com (construcción de intervalos) | Teclado de notas con ♭♭ ♭ ♮ ♯ 𝄪 |
| Dificultad de acordes de menor a mayor | EarMaster (curso estándar) | Niveles: tríadas → 7ma → extensiones |
| Grados "de oído": cadencia I–IV–V–I, después una nota, y al final la resolución a la tónica | Functional Ear Trainer, ToneDear | Ejercicio "Oído funcional" |
| Sesiones de N preguntas con racha, % y repaso de errores | Tenuto (Challenge), Complete Ear Trainer | Sesiones de 10 o 20 preguntas |
| Metrónomo con acentos por pulso, subdivisiones, tap, entrenador de velocidad y compases en silencio | Soundbrenner, Pro Metronome, iReal Pro, The Guitar Gym | Metrónomo completo |
| Ejercicios con tab, objetivo, tempo meta y registro del mejor bpm limpio | Modacity, AxeLog, PracticeQuest, JustinGuitar | Ejercicios por objetivo, con escalera de tempo |
| Separar velocidad de calidad: el puntaje de tipo juego premia la velocidad | Críticas a Yousician | Objetivo **Calidad sonora** separado de **Velocidad** |
| Practicar sobre un bordón o un acorde fijo | Plectrum Practice, Modacity, iReal Pro (vamp) | "Sobre un acorde fijo" (escalas y arpegios) |
| Tríadas por grupo de cuerdas, drop 2, drop 3 y CAGED | FretBuzz Chords, DroPilot | Formación de acordes |

No se encontró ninguna app con ejercicios específicos de dominantes secundarios, sustitución tritonal o intercambio modal. Esos ejercicios usan el mismo formato que el resto: un acorde dentro de una tonalidad, y se responde el cifrado romano o se construye el acorde.

## 2. Teoría: fuentes y convenciones

- **Escalas y modos.**
  - Menor armónica: Locrio ♮6, Jónico #5, Dórico #4, Frigio dominante, Lidio #2 y Superlocrio bb7.
  - Menor melódica: Dórico b2, Lidio aumentado, Lidio dominante, Mixolidio b6, Locrio ♮2 y Alterada.
  - Fuente: Wikipedia, "Jazz scale". Los nombres en castellano son los habituales en la enseñanza de jazz en Argentina; varían según el autor.
- **Blues (v5).** Escala de blues = 1 b3 4 b5 5 b7 (blue note b5 en azul). Pentatónica mixolidia = 1 2 3 5 6 b7 (nota mixolidia b7 en verde). Nombres y colores según el material del profesor.
- **Posiciones (v5).** Siempre ordenadas desde la más grave. Arpegios: solo notas del acorde, una posición por cada tónica en las cuerdas 6 a 2 tocada con el dedo 1; sin extensiones por ahora.
- **Acordes.** Se usa el cifrado habitual: maj7, m7, 7, m7(b5), °7, m(maj7), maj7(#5), 7(#5), 7sus4, 6, m6, add9, 6/9, maj9, 9, m9, m11, maj7(#11), 9sus4, 13, 7(b9), 7(#9), 7(#11), 7(b13) y m9(b5).
  - El 13 se toca sin 11.
  - El "11" dominante se presenta como 9sus4, porque la 3ra choca con la 11.
- **Chord-scale (Berklee).** Fuente: Nettles & Graf, *The Chord Scale Theory & Jazz Harmony*.

  | Acorde | Escala | Tensiones | Nota a evitar |
  |---|---|---|---|
  | Imaj7 | Jónico | 9, 13 | 11 |
  | IIm7 | Dórico | 9, 11 | 13 (según Berklee; Levine la acepta) |
  | IIIm7 | Frigio | 11 | b9, b13 |
  | IVmaj7 | Lidio | 9, #11, 13 | — |
  | V7 | Mixolidio | 9, 13 | 11 |
  | VIm7 | Eólico | 9, 11 | b13 |
  | VIIm7(b5) | Locrio | 11, b13 | b9 |

- **Dominantes secundarios.**
  - Hay uno para cada grado salvo el VII, que es disminuido y no puede funcionar como tónica.
  - V7/II: Mixolidio b6 (9, b13).
  - V7/III: Frigio dominante (b9, #9, b13).
  - V7/IV y V7/V: Mixolidio (9, 13).
  - V7/VI: Frigio dominante (b9, b13; algunos autores agregan #9).
  - Fuentes: Wikipedia, "Secondary chord"; tablas de Berklee; Alfred.
- **Sustitución tritonal.**
  - Es el dominante a un tritono de distancia, por ejemplo G7 → Db7.
  - Comparte el tritono (Si/Dob–Fa) y resuelve por semitono descendente.
  - Escala: Lidio dominante (9, #11, 13).
- **Intercambio modal.**
  - Del eólico: IVm7, IVm6, IIm7(b5), bIIImaj7, Vm7, bVImaj7, bVII7 (backdoor) e Im7.
  - Del frigio: bIImaj7 (napolitano) y bVIIm7.
  - Del dórico: IV7.
  - Del lidio: II7 y #IVm7(b5).
  - Del mixolidio: Vm7 y bVIImaj7.
  - De la menor armónica: Im(maj7).
  - Cada acorde tiene su escala de chord-scale.
- **Posiciones.**
  - **Escala mayor y modos:** las 7 figuras del modelo "Posición Escala Mayor", siempre en el mismo orden (figura 1 a 7).
  - **Pentatónicas:** las 5 figuras de la página original del libro.
  - **Menor armónica y melódica:** salen de las mismas 7 figuras de la mayor relativa, alterando las notas que cambian (Sol → Sol# en La menor armónica; Fa → Fa# y Sol → Sol# en La menor melódica). Si la nota alterada se sale de la ventana de 5 trastes, pasa a la cuerda vecina. Así los 7 modos de cada familia comparten figuras, igual que los modos griegos.
  - **Arpegios:** notas del acorde dentro de las 7 ventanas de la escala mayor de su fundamental, con digitación de un dedo por traste.

## 3. Validación automática

Se validan las 25 escalas y los 31 acordes en las 12 tónicas:

- Ninguna nota sobra ni falta.
- Ninguna nota se sale de la ventana ni se duplica.
- Los dedos van del 1 al 4 y son crecientes en cada cuerda.
- La escritura usa la letra correcta (por ejemplo Re menor armónica = Re Mi Fa Sol La Sib Do#).
- Los acordes diatónicos de mayor, menor armónica y menor melódica coinciden con la tabla de referencia.
