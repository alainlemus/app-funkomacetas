import type { ConfigContext, ExpoConfig } from 'expo/config';

// La config vive en app.json; aquí solo se inyecta la versión.
// Única fuente de la versión visible (la de la tienda): package.json.
// Se sube SOLO con `npm run release:patch|minor|major`, nunca a mano.
// El número de build lo lleva EAS en remoto (appVersionSource "remote" + autoIncrement).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('./package.json') as { version: string };

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  version,
});
