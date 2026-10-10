# Changelog

Formato: cada versión publicada en tienda. Ver `RELEASING.md`.

## [Sin publicar]

## [2.0.0] - 2026-10-09

> Requiere backend 1.1.0 o posterior (rutas `/api/figures`).

### Cambiado
- Nuevo diseño con la identidad del logo: verde, crema y rojo, tipografías Fredoka y Nunito, encabezados y tarjetas redondeados, iconos nuevos en la barra inferior y pantalla de inicio de sesión con el logo grande.
- Se adaptó al nuevo modelo: ahora solo hay Categorías y Figuras, y la figura es el producto (precio, costo, stock y fotos). Se quitó la pantalla de "Productos" y el selector de figura del formulario.
- El tablero usa los totales de todo el inventario (antes solo contaba la primera página), y sus tarjetas abren el listado ya filtrado.
- El formulario permite guardar figuras sin precio si están inactivas (las del catálogo del proveedor llegan así).

### Corregido
- Al iniciar sesión, un usuario que no es administrador ya no entra a la app (antes entraba y todo fallaba); si la sesión vence, la app regresa sola al inicio de sesión.
- La lista de figuras ya no hace dos peticiones al abrir.
- El botón "+10" del tablero suma 10 al stock actual (antes lo dejaba en el mínimo más 10).
- Los errores del servidor (SKU repetido, categoría con figuras, imagen inválida, sin conexión) se muestran con su motivo.
- El botón para marcar una foto como principal ahora dice "Hacer principal".
- La foto principal de las figuras del catálogo del proveedor ya aparece en el formulario.

### Agregado
- Pruebas automáticas de las pantallas y del servicio de la API (`npm test`).
- Tres ambientes (local, staging y producción) con perfiles de EAS que apuntan a su API (`localhost` de Herd, `dev.eljardindelasmacetas.com` y `eljardindelasmacetas.com`), nombre e identificador propios por ambiente y scripts `start:*` y `build:*`.
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
