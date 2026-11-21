import { DOCUMENT, Location } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { navigationEnd$ } from '@core/navigation/navigation-end';
import { Toast } from '@shared/ui/toast';
import { SectionUnavailable } from '@shared/ui/section-unavailable';
import { ToastStore } from '@core/notifications/toast-store';
import { Header } from '@layout/components/header/header';
import { Footer } from '@layout/components/footer/footer';
import { ThemeStore } from '@core/theme/theme-store';
import { injectIsBrowser } from '@core/ssr/inject-is-browser';

const ADMIN_URL = /^\/admin(?:[/?#]|$)/;

@Component({
  selector: 'app-root',
  imports: [Header, Footer, RouterOutlet, Toast, SectionUnavailable],
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
      @defer (hydrate on viewport; on viewport) {
        <app-footer />
      } @placeholder {
        <!-- Hauteurs calées sur les breakpoints ; écart résiduel entre paliers assumé (CSR seul, hors fenêtre). -->
        <div
          class="h-[71.15625rem] border-t border-nav-border bg-surface sm:h-[54.6875rem] md:h-[26.3125rem] lg:h-[21.84375rem]"
        ></div>
      } @error {
        <app-section-unavailable />
      }
    }
    <app-toast [messages]="toastStore.messages()" (dismiss)="toastStore.dismiss($event)" />
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly initialPath = inject(Location).path();
  private readonly isBrowser = injectIsBrowser();
  protected readonly toastStore = inject(ToastStore);

  constructor() {
    inject(ThemeStore);
    this.resetScrollOnNavigation();
  }

  // Manuel plutôt que scrollPositionRestoration : fiable avec les view transitions.
  private resetScrollOnNavigation(): void {
    navigationEnd$(this.router)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.isBrowser) return;
        if (this.router.lastSuccessfulNavigation()?.trigger === 'popstate') return;
        this.document.defaultView?.scrollTo({ top: 0 });
      });
  }

  private readonly navigationEnd = toSignal(navigationEnd$(this.router));

  // Avant le premier NavigationEnd, seule l'adresse demandée dit si la page est admin.
  readonly isAdminRoute = computed(() =>
    ADMIN_URL.test(this.navigationEnd()?.urlAfterRedirects ?? this.initialPath),
  );

  protected openAdminShortcut(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/admin']);
  }
}
