# Changelog

Formato: cada versión publicada en tienda. Ver `RELEASING.md`.

## [Sin publicar]

> Al publicar, subir **major (2.0.0)**: requiere backend 1.1.0 o posterior (rutas `/api/figures`).

### Cambiado
- Se adaptó al nuevo modelo: ahora solo hay Categorías y Figuras, y la figura es el producto (precio, costo, stock y fotos). Se quitó la pantalla de "Productos" y el selector de figura del formulario.
- El tablero usa los totales de todo el inventario (antes solo contaba la primera página), y sus tarjetas abren el listado ya filtrado.
- El formulario permite guardar figuras sin precio si están inactivas (las del catálogo del proveedor llegan así).

### Agregado
- Búsqueda por nombre o SKU en el servidor, filtros (Todas, Activas, Inactivas, Sin precio, Stock bajo) y carga de más resultados al desplazar la lista.

## [1.1.0] - 2026-10-09

### Cambiado
- Las fotos se reducen por su lado mayor (1200 px) y se comprimen antes de subirlas; el servidor las convierte a WebP.

### Agregado
- La versión de la app se muestra en la pantalla de inicio de sesión.
- Versionado semántico: el número vive en `package.json` y se sube con `npm run release:*`.

## [1.0.0] - 2026-10-09

### Agregado
- Primera versión: administración de categorías, figuras y productos del catálogo de El Jardín de las Macetas, con fotos desde la cámara o la galería.
