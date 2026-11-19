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
