import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const silentErrors = (): HttpContext => new HttpContext().set(SKIP_ERROR_TOAST, true);

// Une relecture de fond ne doit jamais interrompre l'écran par un toast.
export const silentWhen = (background = false): HttpContext =>
  new HttpContext().set(SKIP_ERROR_TOAST, background);
