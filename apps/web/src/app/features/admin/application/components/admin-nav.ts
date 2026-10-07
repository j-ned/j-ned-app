import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type Signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { AppIconTile } from '@shared/ui/icon-tile';

export type AdminNavItem = {
  readonly route: string;
  readonly icon: string;
  readonly label: string;
  readonly exact?: boolean;
  readonly badge?: Signal<number>;
  readonly groupLabel?: string;
};

@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive, AppIcon, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col h-full' },
  template: `
    <div class="p-4 border-b border-foreground/10">
      <div class="flex items-center gap-3">
        <app-icon-tile class="bg-primary/10 border border-primary/30">
          <app-icon name="th-large" [size]="20" class="text-primary" />
        </app-icon-tile>
        @if (!collapsed()) {
          <div class="overflow-hidden">
            <h2 class="text-lg font-bold text-foreground leading-tight">Admin</h2>
            @if (displayName()) {
              <p class="text-xs text-muted truncate">{{ displayName() }}</p>
            }
          </div>
        }
      </div>
    </div>

    @if (showCollapseButton()) {
      <div class="px-3 py-2">
        <button
          type="button"
          (click)="collapseToggle.emit()"
          class="flex items-center justify-center w-full min-h-11 p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
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
    }

    <nav class="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Navigation principale">
      @for (item of navItems(); track item.route) {
        @if (!collapsed() && item.groupLabel) {
          <div
            class="px-3 pt-4 pb-2 text-[10px] uppercase tracking-widest font-semibold text-muted"
          >
            {{ item.groupLabel }}
          </div>
        }
        <a
          [routerLink]="item.route"
          routerLinkActive="bg-primary/10 text-primary border-primary/30"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
          (click)="navigate.emit()"
          class="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
          [attr.title]="collapsed() ? item.label : null"
        >
          <app-icon [name]="item.icon" [size]="20" class="shrink-0" />
          @let unread = item.badge?.() ?? 0;
          @if (!collapsed()) {
            <span class="flex-1">{{ item.label }}</span>
            @if (unread > 0) {
              <span
                data-testid="nav-unread-count"
                class="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold min-w-[1.25rem] text-center"
              >
                {{ unread }}<span class="sr-only">{{ unread === 1 ? ' non lu' : ' non lus' }}</span>
              </span>
            }
          } @else if (unread > 0) {
            <span
              class="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
              aria-hidden="true"
            ></span>
          }
        </a>
      }
    </nav>

    <div class="px-3 py-4 border-t border-foreground/10 space-y-1">
      <a
        routerLink="/admin/settings"
        routerLinkActive="bg-primary/10 text-primary border-primary/30"
        ariaCurrentWhenActive="page"
        (click)="navigate.emit()"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
        [attr.title]="collapsed() ? 'Paramètres' : null"
      >
        <app-icon name="cog" [size]="20" class="shrink-0" />
        @if (!collapsed()) {
          <span>Paramètres</span>
        }
      </a>
      <button
        type="button"
        data-testid="admin-theme-toggle"
        (click)="themeToggle.emit()"
        class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
        [attr.title]="collapsed() ? themeToggleLabel() : null"
      >
        <app-icon [name]="isDark() ? 'moon' : 'sun'" [size]="20" class="shrink-0" />
        <span [class.sr-only]="collapsed()">{{ themeToggleLabel() }}</span>
      </button>
      <a
        routerLink="/"
        (click)="navigate.emit()"
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
        (click)="logoutClick.emit()"
        aria-label="Déconnexion"
        class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
        [attr.title]="collapsed() ? 'Déconnexion' : null"
      >
        <app-icon name="sign-out" [size]="20" class="shrink-0" />
        @if (!collapsed()) {
          <span>Déconnexion</span>
        }
      </button>
    </div>
  `,
})
export class AdminNav {
  readonly collapsed = input<boolean>(false);
  readonly showCollapseButton = input<boolean>(true);
  readonly displayName = input<string | undefined>(undefined);
  readonly navItems = input.required<readonly AdminNavItem[]>();
  readonly isDark = input.required<boolean>();

  protected readonly themeToggleLabel = computed(() =>
    this.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre',
  );

  readonly collapseToggle = output<void>();
  readonly logoutClick = output<void>();
  readonly navigate = output<void>();
  readonly themeToggle = output<void>();
}
