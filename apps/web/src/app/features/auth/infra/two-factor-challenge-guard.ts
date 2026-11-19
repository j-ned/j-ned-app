import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';

/** La page de code n'a de sens qu'après l'étape mot de passe : sans challenge en cours, retour à la connexion. */
export const twoFactorChallengeGuard: CanMatchFn = () => {
  if (inject(AuthStore).pendingChallengeToken() !== null) {
    return true;
  }

  return inject(Router).createUrlTree(['/login']);
};
