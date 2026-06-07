import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Toast, ToastStore } from '@shared/ui';
import { Header, Footer } from '@layout';
import { AuthStore } from '@core/auth/auth-store';

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
    <main class="min-h-svh">
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
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly toastStore = inject(ToastStore);

  constructor() {
    this.auth.restoreSession();
    this.resetScrollOnNavigation();
  }

  /**
   * Réinitialise le scroll en haut à chaque navigation de route (hors retour
   * arrière, où le scroll-restoration du routeur restaure la position). Fiable
   * même avec les view transitions, contrairement au scrollPositionRestoration
   * seul, et inoffensif pour le scroll programmatique vers une section (qui se
   * déclenche après, depuis SectionScroller).
   */
  private resetScrollOnNavigation(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (!this.isBrowser) return;
        if (this.router.lastSuccessfulNavigation()?.trigger === 'popstate') return;
        this.document.defaultView?.scrollTo({ top: 0 });
      });
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
