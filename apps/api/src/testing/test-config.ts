import { AppConfigService } from '../config/app-config.service';
import { validateEnv } from '../config/env.validation';

// Le minimum que `validateEnv` exige : jamais une valeur réelle de déploiement.
const BASE_TEST_ENV = {
  DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  JWT_SECRET: 'test-jwt-secret-of-at-least-32-chars',
} as const;

// Vraie `AppConfigService`, validée comme au démarrage : un test ne fabrique pas de config partielle.
export function createTestConfig(
  overrides: Readonly<Record<string, unknown>> = {},
): AppConfigService {
  return new AppConfigService(validateEnv({ ...BASE_TEST_ENV, ...overrides }));
}
