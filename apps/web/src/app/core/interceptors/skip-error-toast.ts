import { HttpContext, HttpContextToken } from '@angular/common/http';

/** L'échec d'une requête marquée par ce jeton n'est pas signalé par un toast. */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const silentErrors = (): HttpContext => new HttpContext().set(SKIP_ERROR_TOAST, true);
