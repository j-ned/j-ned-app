import { refreshWhenVisible } from '@core/navigation/refresh-when-visible';

// L'API compte les lectures de l'admin par compte, 60 par minute et par route : 30 retours au plus
// en laissent 30 aux actions et aux navigations.
export const ADMIN_REFRESH_MIN_INTERVAL_MS = 2_000;

export function refreshAdminWhenVisible(refresh: () => void): void {
  refreshWhenVisible(refresh, { minIntervalMs: ADMIN_REFRESH_MIN_INTERVAL_MS });
}
