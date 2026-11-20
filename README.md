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
