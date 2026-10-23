import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@shared/ui/button';

@Component({
  selector: 'app-page-not-found',
  imports: [RouterLink, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="min-h-[calc(100svh-5rem)] mt-20 flex flex-col items-center justify-center bg-background text-foreground px-4 py-8"
    >
      <h1
        class="text-6xl sm:text-7xl font-extrabold text-primary mb-4"
        data-testid="not-found-title"
      >
        404
      </h1>
      <h2 class="text-2xl md:text-3xl font-bold mb-2">Page non trouvée</h2>
      <p class="text-muted mb-8 max-w-md text-center" data-testid="not-found-message">
        Oups&#8239;! La page que tu cherches n'existe pas ou a été déplacée.<br />
        Retourne à l'accueil ou fais un tour dans les autres sections du site.
      </p>
      <a appButton routerLink="/" data-testid="not-found-home-link">Retour à l'accueil</a>
    </div>
  `,
})
export class PageNotFound {}
