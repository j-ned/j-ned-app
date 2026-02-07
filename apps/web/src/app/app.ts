import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './layout/components/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.control.l)': 'onCtrlL($event)',
  },
  template: `
    @if (!isAdminRoute()) {
      <app-header />
    }
    <main>
      <router-outlet />
    </main>
  `,
})
export class App {
  private readonly router = inject(Router);

  readonly isAdminRoute = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isAdminRoute.set(event.urlAfterRedirects.startsWith('/admin'));
      });
  }

  onCtrlL(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/admin']);
  }
}
