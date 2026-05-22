import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Toast, ToastStore } from '@shared/ui';
import { Header, Footer } from '@layout';
import { AuthStore } from '@features/auth/infra';

@Component({
  selector: 'app-root',
  imports: [Header, Footer, RouterOutlet, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.control.l)': 'openAdminShortcut($event)',
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
    <app-toast [messages]="toastStore.messages()" (dismiss)="toastStore.dismiss($event)" />
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  protected readonly toastStore = inject(ToastStore);

  constructor() {
    // Restaure la session au boot client. Appelé explicitement (et pas
    // uniquement via le constructor d'AuthStore) car avec
    // provideClientHydration, l'instance d'AuthStore peut être réutilisée
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

  protected openAdminShortcut(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/admin']);
  }
}
