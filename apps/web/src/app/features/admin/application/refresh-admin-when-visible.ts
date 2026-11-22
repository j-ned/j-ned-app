import { refreshWhenVisible } from '@core/navigation/refresh-when-visible';

// L'API limite chaque lecture de l'admin à 10 par minute et par IP : 4 retours au plus en laissent 6.
export const ADMIN_REFRESH_MIN_INTERVAL_MS = 15_000;

export function refreshAdminWhenVisible(refresh: () => void): void {
  refreshWhenVisible(refresh, { minIntervalMs: ADMIN_REFRESH_MIN_INTERVAL_MS });
}
