/** Valeurs admises de `APP_ENV` ; absente : exécution locale (poste, CI). */
export const APP_ENVS = ['production', 'preview'] as const;

/** `local` : aucune déclaration (poste, CI). */
export type Deployment = 'production' | 'preview' | 'local';

type DeploymentEnv = { readonly APP_ENV?: string | undefined };

/**
 * Où tourne l'API, d'après `APP_ENV` seule, jamais d'après `NODE_ENV` : un environnement de
 * démonstration tourne lui aussi en `NODE_ENV=production`.
 */
export function resolveDeployment(env: DeploymentEnv): Deployment {
  if (env.APP_ENV === undefined) return 'local';
  return env.APP_ENV === 'production' ? 'production' : 'preview';
}
