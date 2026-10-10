import type { ConfigContext, ExpoConfig } from 'expo/config';

// La config vive en app.json; aquí solo se inyecta lo que cambia por ambiente.
//
// Versión: única fuente en package.json (visible en tienda y en el login). Se sube SOLO con
// `npm run release:patch|minor|major`, nunca a mano. El número de build lo lleva EAS en remoto
// (appVersionSource "remote" + autoIncrement).
//
// Ambiente: APP_ENV ('local' | 'staging' | 'production') lo define cada perfil de eas.json
// (junto con EXPO_PUBLIC_API_URL). Sin APP_ENV se asume 'local'.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('./package.json') as { version: string };

type AppEnv = 'local' | 'staging' | 'production';

const APP_ENV = (process.env.APP_ENV as AppEnv | undefined) ?? 'local';

// Cada ambiente se instala por separado en el mismo dispositivo.
const VARIANTS: Record<AppEnv, { name: string; suffix: string }> = {
  local: { name: 'Jardín (Local)', suffix: '.local' },
  staging: { name: 'Jardín (Staging)', suffix: '.staging' },
  production: { name: 'El Jardín de las Macetas', suffix: '' },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = VARIANTS[APP_ENV] ?? VARIANTS.local;
  const isProduction = APP_ENV === 'production';

  return {
    ...(config as ExpoConfig),
    name: variant.name,
    version,
    ios: {
      ...config.ios,
      bundleIdentifier: `${config.ios?.bundleIdentifier}${variant.suffix}`,
      infoPlist: {
        ...config.ios?.infoPlist,
        // Solo en local: permite http://sistema-funkos.test (Herd). Staging y producción usan https.
        ...(APP_ENV === 'local' && {
          NSAppTransportSecurity: {
            NSAllowsLocalNetworking: true,
            NSExceptionDomains: {
              test: { NSIncludesSubdomains: true, NSExceptionAllowsInsecureHTTPLoads: true },
            },
          },
        }),
      },
    },
    android: {
      ...config.android,
      package: `${config.android?.package}${variant.suffix}`,
    },
    plugins: [
      ...(config.plugins ?? []),
      // Android bloquea http por defecto; solo local lo necesita.
      ...(APP_ENV === 'local' && !isProduction
        ? [['expo-build-properties', { android: { usesCleartextTraffic: true } }] as [string, object]]
        : []),
    ],
  };
};
