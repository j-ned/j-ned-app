import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { UiToast } from '@shared/ui';
import { Header, Footer } from '@layout';

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
