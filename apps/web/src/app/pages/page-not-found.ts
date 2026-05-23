import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <main
      class="min-h-svh flex flex-col items-center justify-center bg-background text-foreground px-4"
    >
      <h1 class="text-7xl font-extrabold text-primary mb-4">404</h1>
      <h2 class="text-2xl md:text-3xl font-bold mb-2">Page non trouvée</h2>
      <p class="text-muted mb-8 max-w-md text-center">
        Oups ! La page que vous cherchez n'existe pas ou a été déplacée.<br />
        Retournez à l'accueil ou explorez d'autres sections du site.
      </p>
      <a
        routerLink="/"
        class="btn-primary gap-2"
      >
        Retour à l'accueil
      </a>
    </main>
  `,
})
export class PageNotFound {}
