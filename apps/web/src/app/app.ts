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
  // Force l'instanciation d'AuthService au boot client. Sans cette injection
  // explicite ici, le constructor (qui déclenche restoreSession()) n'est jamais
  // appelé tant que l'utilisateur ne visite pas une route protégée — résultat :
  // perte de session au refresh navigateur même si le cookie est valide.
  // Le AppComponent est garanti d'être créé au boot, contrairement aux
  // appInitializers qui peuvent être skip après hydration SSG.
  private readonly _auth = inject(AuthService);

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
