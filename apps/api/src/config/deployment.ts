/** Valeurs admises de `APP_ENV` ; absente : exécution locale (poste, CI). */
export const APP_ENVS = ['production', 'preview'] as const;

/** `preview` couvre toute exécution Vercel hors production, `local` l'absence de toute déclaration. */
export type Deployment = 'production' | 'preview' | 'local';

type DeploymentEnv = {
  readonly VERCEL_ENV?: string | undefined;
  readonly APP_ENV?: string | undefined;
};

/**
 * Où tourne l'API, jamais d'après `NODE_ENV` (qui peut valoir `production` sur une preview).
 * Sur Vercel, `VERCEL_ENV` est posé par la plateforme et l'emporte : une variable `APP_ENV` mal
 * ciblée ne fait pas passer une preview pour la production. Ailleurs, `APP_ENV` déclare l'hébergement.
 */
export function resolveDeployment(env: DeploymentEnv): Deployment {
  const declared = env.VERCEL_ENV ?? env.APP_ENV;
  if (declared === undefined) return 'local';
  return declared === 'production' ? 'production' : 'preview';
}
