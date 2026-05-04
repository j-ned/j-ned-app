import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { UiToast } from '@shared/ui';
import { Header, Footer } from '@layout';
import { AuthService } from '@features/auth/infrastructure';

@Component({
  selector: 'app-root',
  imports: [Header, Footer, RouterOutlet, UiToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.control.l)': 'onCtrlL($event)',
  },
  template: `
    @if (!isAdminRoute()) {
      <app-header />
    }
    <main class="min-h-screen">
      <router-outlet />
    </main>
    @if (!isAdminRoute()) {
      <app-footer />
    }
    <app-ui-toast />
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  constructor() {
    // Restaure la session au boot client. Appelé explicitement (et pas
    // uniquement via le constructor d'AuthService) car avec
    // provideClientHydration, l'instance d'AuthService peut être réutilisée
    // depuis le SSG : son constructor n'est alors PAS re-exécuté côté browser,
    // et le restoreSession() initial skip côté serveur n'est jamais rejoué.
    // Cette ligne garantit que /auth/me part au boot client, peu importe le
    // cycle de vie du Service. Idempotent.
    this.auth.restoreSession();
  }

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    ),
  );

  readonly isAdminRoute = computed(
    () => this.navigationEnd()?.urlAfterRedirects.startsWith('/admin') ?? false,
  );

  onCtrlL(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/admin']);
  }
}
