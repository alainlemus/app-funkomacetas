# Cómo se versiona y despliega la app

`develop` = pruebas (canal **staging**) · `main` = producción (canal **production**).
Punto de partida: **v1.0.0**.

## 1. Las "versiones" que existen

| Qué | Dónde vive | Quién lo cambia |
|---|---|---|
| **Versión** (`1.0.0`), la que ve el usuario en la tienda y en el login | `package.json` → la lee `app.config.ts` | Tú, **solo** con `npm run release:*` |
| **Número de build** (iOS `buildNumber` / Android `versionCode`) | Remoto en EAS (`appVersionSource: "remote"`) | EAS, solo (`autoIncrement` en `staging` y `production`) |

**Nunca** edites la versión a mano ni la agregues a `app.json`.

## 2. Qué número subir (SemVer)

- **patch** `1.0.0 → 1.0.1`: correcciones.
- **minor** `1.0.0 → 1.1.0`: funciones nuevas que no rompen nada.
- **major** `1.0.0 → 2.0.0`: cambios grandes (por ejemplo, requiere una versión nueva del backend).

## 3. Flujo

### A. Día a día (testers)
```bash
git push origin develop
npm run build:staging        # solo si cambió algo nativo o se necesita un build nuevo
```

### B. Lanzamiento a tiendas
```bash
git checkout main && git merge develop
npm run release:patch        # o release:minor / release:major → commit "chore(release): vX.Y.Z" + tag
# mover lo de "Sin publicar" del CHANGELOG.md a la sección de la versión nueva (y amend al commit)
git push origin main --follow-tags
npm run build:production
git checkout develop && git merge main && git push origin develop
```

## 4. Backend

La app usa la API de `sistema-funkos` (`EXPO_PUBLIC_API_URL` en `eas.json`). Las versiones
del backend (`/version.json`) y de la app son independientes; si un cambio de la API rompe
la app, sube **major** en ambos y publícalos juntos.

## 5. Reglas

- Todo lanzamiento a tienda lleva su entrada en `CHANGELOG.md`.
- Nunca reutilices un número ya publicado.
