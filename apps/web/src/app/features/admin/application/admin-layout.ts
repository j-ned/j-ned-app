import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  type Signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../auth/infra';
import { ContactGateway } from '@features/contact/domain';
import { AppIcon } from '@shared/icons';

type NavItem = {
  readonly route: string;
  readonly icon: string;
  readonly label: string;
  readonly exact?: boolean;
  readonly badge?: Signal<number>;
  readonly groupLabel?: string;
};

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen bg-background">
      <aside
        class="flex flex-col border-r border-foreground/10 bg-background transition-all duration-300"
        [class.w-64]="!collapsed()"
        [class.w-20]="collapsed()"
      >
        <!-- Brand -->
        <div class="p-4 border-b border-foreground/10">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center"
            >
              <app-icon name="th-large" [size]="20" class="text-primary" />
            </div>
            @if (!collapsed()) {
              <div class="overflow-hidden">
                <h2 class="text-lg font-bold text-foreground leading-tight">Admin</h2>
                <p class="text-xs text-muted truncate">
                  {{ authService.currentUser()?.displayName }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Collapse button -->
        <div class="px-3 py-2">
          <button
            type="button"
            (click)="collapsed.set(!collapsed())"
            class="flex items-center justify-center w-full p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            [attr.title]="collapsed() ? 'Ouvrir le menu' : 'Réduire le menu'"
            [attr.aria-label]="collapsed() ? 'Ouvrir le menu' : 'Réduire le menu'"
            [attr.aria-expanded]="!collapsed()"
          >
            @if (collapsed()) {
              <app-icon name="angles-right" [size]="20" />
            } @else {
              <app-icon name="angles-left" [size]="20" />
            }
          </button>
        </div>

        <!-- Main nav -->
        <nav class="flex-1 px-3 py-2 space-y-1" aria-label="Navigation principale">
          @for (item of navItems; track item.route) {
            @if (!collapsed() && item.groupLabel) {
              <div
                class="px-3 pt-4 pb-2 text-[10px] uppercase tracking-widest font-semibold text-muted/70"
              >
                {{ item.groupLabel }}
              </div>
            }
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary/10 text-primary border-primary/30"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              class="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
              [attr.title]="collapsed() ? item.label : null"
            >
              <app-icon [name]="item.icon" [size]="20" class="shrink-0" />
              @if (!collapsed()) {
                <span class="flex-1">{{ item.label }}</span>
                @if (item.badge && item.badge()! > 0) {
                  <span
                    class="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold min-w-[1.25rem] text-center"
                  >
                    {{ item.badge() }}
                  </span>
                }
              } @else if (item.badge && item.badge()! > 0) {
                <span
                  class="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
                  aria-hidden="true"
                ></span>
              }
            </a>
          }
        </nav>

        <!-- Footer: settings, back, logout -->
        <div class="px-3 py-4 border-t border-foreground/10 space-y-1">
          <a
            routerLink="/admin/settings"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Paramètres' : null"
          >
            <app-icon name="cog" [size]="20" class="shrink-0" />
            @if (!collapsed()) {
              <span>Paramètres</span>
            }
          </a>
          <a
            routerLink="/"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            [attr.title]="collapsed() ? 'Retour au site' : null"
          >
            <app-icon name="external-link" [size]="20" class="shrink-0" />
            @if (!collapsed()) {
              <span>Retour au site</span>
            }
          </a>
          <button
            type="button"
            (click)="authService.logout()"
            aria-label="Déconnexion"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            [attr.title]="collapsed() ? 'Déconnexion' : null"
          >
            <app-icon name="sign-out" [size]="20" class="shrink-0" />
            @if (!collapsed()) {
              <span>Déconnexion</span>
            }
          </button>
        </div>
      </aside>

      <main class="flex-1 p-8 overflow-y-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayout {
  protected readonly authService = inject(AuthStore);
  private readonly _contactGateway = inject(ContactGateway);

  protected readonly collapsed = signal(false);

  private readonly _unreadRes = rxResource({
    stream: () => this._contactGateway.getUnreadCount(),
  });

  private readonly _inboxCount = computed(() => this._unreadRes.value() ?? 0);

  protected readonly navItems: readonly NavItem[] = [
    { route: '/admin', icon: 'th-large', label: 'Dashboard', exact: true },
    {
      route: '/admin/projects',
      icon: 'desktop',
      label: 'Projets',
      groupLabel: 'Contenu',
    },
    { route: '/admin/cv', icon: 'file-pdf', label: 'CV' },
    {
      route: '/admin/messages',
      icon: 'envelope',
      label: 'Messages',
      badge: this._inboxCount,
    },
    { route: '/admin/analytics', icon: 'chart-bar', label: 'Analytics' },
  ];
}
