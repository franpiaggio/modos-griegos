# Modos griegos – diagramas para guitarra

Recreación de la página "Posición Pentatónica" del libro, extendida a los 7 modos de la escala mayor de Do
(Jónico, Dórico, Frigio, Lidio, Mixolidio, Eólico, Locrio). Todos los modos usan las mismas 5 figuras de la
escala mayor; cambia la tónica resaltada:

- Círculo rojo: tónica del modo.
- Cuadrado naranja: tónica de la escala mayor de origen (Do).

La primera página reproduce la pentatónica original como referencia de formato.

## Archivos

- `data.mjs`: notas y digitaciones de cada posición (cuerda, traste, dedo).
- `build.mjs`: genera `index.html` (SVG en A4, coordenadas medidas del original a 150 dpi).
- `make-pdf.sh`: genera `index.html` y `modos-griegos.pdf` con Chrome headless (mismo motor que la web).

```sh
./make-pdf.sh
```

## Versión 2 (`v2/`)

Sigue el modelo "Posición Escala Mayor": 7 posiciones por página. La primera página reproduce el modelo como
referencia; después vienen los 7 modos con las mismas figuras y solo la tónica del modo marcada.

- `v2/index.html` y `v2/modos-tonica-negra.pdf`: la tónica es negra en todos los modos.
- `v2/index.html?v=colores` y `v2/modos-colores.pdf`: cada modo tiene su color. El selector de la barra cambia de variante sin recargar.

Los datos están en `data-v2.mjs` y la geometría en `build-v2.mjs`.

## Versión 3 (`v3/`): app interactiva

App web estática (sin build) con la estética de la v2:

- Escalas: los 7 modos en las 12 tónicas (mismas figuras de la escala mayor).
- Arpegios: tríadas mayor y menor; con 7ma: maj7, m7, 7 (dominante), m7(b5) (semidisminuido) y dim7.
- Fila de variantes siempre visible (y en la vista ampliada): cambia entre tipos de arpegio o modos con un toque, o con las teclas [ y ].
- Tocar una posición la abre en grande (en celular se muestra vertical). Zoom de la hoja y de la vista ampliada.
- Reproducción con sonido de cuerda: tempo, dirección (↑, ↓, ↑↓), repetir, y resaltado de la nota que suena.
- Configuración (⚙): tónica negra o color por tipo, etiquetas (dedos, notas, intervalos), Do Re Mi o C D E, mástil completo.
- Exportar: cada posición (o el mástil) por separado en PNG, SVG o PDF desde la vista ampliada (botón de descarga); todas por separado en un ZIP, o la hoja completa en PDF, desde ⚙.
- La URL guarda la selección (`?k=escala&r=2&t=dorico#p3`), así se puede compartir.

Archivos: `v3/theory.js` (teoría y digitaciones), `v3/render.js` (dibujo), `v3/audio.js` (sonido), `v3/app.js` (interfaz).

## Versión 4 (`v4/`): teoría y práctica completas

https://franpiaggio.github.io/modos-griegos/v4/

- **Información**: lista lateral con escalas (modos griegos, pentatónicas y blues, menor armónica y melódica con sus modos) y arpegios (tríadas, 7ma, extensiones) en todas las tónicas, con la estética del libro, ficha (fórmula, notas, acordes de la escala, uso), sonido, vista ampliada y exportación.
- **Teoría**: cada tema tiene **Teoría** (explicación con tablas y ejemplos para escuchar) y **Práctica** (sesiones con corrección): intervalos, escalas, acordes, grados y detección de escalas, oído funcional, acordes por función y extensiones, extensiones de arpegios, dominantes secundarios, sustitución tritonal, intercambio modal e improvisación (explorador chord-scale).
- **Técnica**: metrónomo completo, práctica sobre un acorde fijo (escalas y arpegios), 21 ejercicios por objetivo (velocidad / calidad sonora) con escalera de tempo y registro, y formación de acordes (CAGED, tríadas por grupo de cuerdas, drop 2 y drop 3).
- Investigación de apps y fuentes teóricas: `v4/INVESTIGACION.md`.
- Sonido: guitarra criolla (nylon) o acústica (acero), una muestra por semitono, del banco MusyngKite (CC-BY-SA 3.0) vía [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts). Animaciones con GSAP.

## Versión 5 (`v5/`): capítulos y logros

https://franpiaggio.github.io/modos-griegos/v5/

- **Capítulos**: el material de estudio en 13 capítulos (intervalos, escalas, modos, pentatónicas, tríadas, tétradas, menor armónica, menor melódica, funciones, dominantes secundarios y V–I, intercambio modal, sustitución tritonal, improvisación). Cada uno tiene teoría, lo que se ve en el mástil, sugerencias técnicas y un **desafío** de 10 preguntas: con 80% se completa y se desbloquea el siguiente. Logros por avance. En Información, escalas y arpegios se desbloquean con los capítulos (Configuración → Modo libre desbloquea todo).
- **Correcciones del material**: escala de blues (blue note en azul) y pentatónica mixolidia (nota mixolidia en verde) con leyenda de colores en la hoja; menor armónica y melódica marcan la tónica menor y la nota alterada; posiciones siempre desde la más grave; arpegios solo con las notas del acorde, posiciones con la tónica en el dedo 1, sin extensiones por ahora.
- **Teoría** reescrita: intervalos (distancia, género, tipos), escalas (escala vs. tonalidad, las 4 escalas principales con esquema T/st, armado paso a paso), acordes (tríadas y tétradas) y esquema de la escala cromática para arpegios.
- **Técnica**: nuevo ejercicio de relaciones V–I, I–V–I y II–V–I (mayor y menor) con notas guía, loop con metrónomo y qué tocar sobre cada acorde.

## Versión 6 (`v6/`): curso VISUALIZAR

https://franpiaggio.github.io/modos-griegos/v6/

Capítulos reorganizados según el temario del curso **VISUALIZAR** (guitarra orientada a la visualización del diapasón):

1. El diapasón y la escala pentatónica
2. Acordes, arpegios y escala
3. Sistema tonal: escala mayor, menor y círculo de quintas
4. Modos griegos
5. Técnica (abierta desde el inicio, se practica en paralelo)
6. Extensiones de arpegios y escalas (superposición)
7. Trabajo final de improvisación (blues, rock, balada, metal y un género a elección)

- Cada capítulo lista sus **temas** en orden; cada tema enlaza la teoría, las escalas y arpegios de Información y las herramientas de Técnica que lo trabajan.
- Los capítulos teóricos se completan con un desafío (80 %). Técnica y el trabajo final se completan marcando cada tema como hecho.
- El progreso de la v6 se guarda aparte del de la v5.

## Versión 7 (`v7/`): ilustraciones y guitarra en mano

https://franpiaggio.github.io/modos-griegos/v7/

- **Ilustraciones propias** (SVG, sin texto, en `v7/illus.js`): un mástil en la portada con la pentatónica menor (posición 1 llena, posición 2 en contorno) y un dibujo por capítulo, en la lista y en la cabecera de cada capítulo. Cada capítulo tiene su color.
- **Guitarra en mano** (botón en la barra superior o en Configuración): la pantalla no se apaga (Wake Lock), la letra y los botones se agrandan para leer a distancia, y en cada capítulo se pasa de tema con las flechas o con un pedal de pasar páginas (PageDown/PageUp); Enter marca el tema como hecho.
- **Todo en la guitarra** (`v7/guitar.js` y `fretboard()` en `v7/viz.js`): cada tema de Teoría tiene su ejemplo en el mástil (formas de intervalos y mapa de intervalos, escalas en una cuerda y en posición, acordes por terceras de cuerda en cuerda, grados y funciones en la zona de la tónica, cadena de dominantes, tritono en forma shell, intercambio modal en la misma posición, escalas sobre acordes con colores por rol). La corrección de cada pregunta de Práctica muestra la respuesta en el mástil, en lugar del teclado. En Técnica → V–I, las notas guía se ven moviéndose traste a traste. En Información, el teclado se reemplazó por la misma nota en una cuerda. Cada capítulo suma su figura en la guitarra.
