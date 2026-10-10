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

## 4. Ambientes

Cada perfil de `eas.json` fija el ambiente (`APP_ENV`) y la API a la que apunta
(`EXPO_PUBLIC_API_URL`); `app.config.ts` ajusta nombre e identificadores por ambiente, así que
los tres se pueden instalar a la vez en el mismo dispositivo.

| Ambiente | Perfil EAS | Rama | API | App instalada | Identificador |
|---|---|---|---|---|---|
| **Local** | `local` (development client; simulador iOS / APK) | cualquiera | `http://sistema-funkos.test/api` (Herd) | Jardín (Local) | `com.funkomacetas.app.local` |
| **Staging** | `staging` (distribución interna, canal `staging`) | `develop` | `https://dev.eljardindelasmacetas.com/api` | Jardín (Staging) | `com.funkomacetas.app.staging` |
| **Producción** | `production` (tiendas, canal `production`) | `main` | `https://eljardindelasmacetas.com/api` | El Jardín de las Macetas | `com.funkomacetas.app` |

```bash
# Desarrollo (Metro) apuntando a cada ambiente
npm run start:local        # / start:staging / start:production

# Builds
npm run build:local        # development client para probar en simulador / APK
npm run build:staging      # testers (iOS ad hoc + APK)
npm run build:production   # tiendas (iOS + AAB)
npm run submit:production
```

- **Local con celular físico:** `sistema-funkos.test` solo resuelve en tu Mac. Usa el simulador
  de iOS, o cambia `EXPO_PUBLIC_API_URL` a la IP de tu Mac (`http://192.168.1.X/api`).
- **Solo local** permite http (excepción de ATS en iOS y `usesCleartextTraffic` en Android); staging
  y producción exigen https.
- **Staging** necesita el dispositivo registrado en EAS (`eas device:create`) para iOS.
- El número de build lo sube EAS solo (`autoIncrement` en staging y producción).

## 5. Backend

La app usa la API de `sistema-funkos` (`/version.json` indica su versión). Las versiones del
backend y de la app son independientes; si un cambio de la API rompe la app, sube **major** en
la app y deja anotado en el CHANGELOG qué backend requiere.

## 6. Reglas

- Todo lanzamiento a tienda lleva su entrada en `CHANGELOG.md`.
- Nunca reutilices un número ya publicado.
- Nunca pongas credenciales en `eas.json` ni en `EXPO_PUBLIC_*` (se incluyen en la app).
