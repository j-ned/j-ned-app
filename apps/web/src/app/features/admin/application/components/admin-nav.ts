import { Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import type { AdminNavGroup } from '../admin-nav-groups';

let nextNavId = 0;

@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive, AppIcon],
  host: { class: 'flex min-h-0 flex-col' },
  template: `
    <nav aria-label="Administration" class="min-h-0 flex-1 overflow-y-auto pt-2.5">
      @for (group of groups(); track $index) {
        @let labelId = group.label ? idPrefix + '-' + $index : null;
        <div
          [attr.role]="labelId ? 'group' : null"
          [attr.aria-labelledby]="labelId"
          [class]="labelId ? 'pt-3.5' : null"
        >
          @if (labelId) {
            <p
              [id]="labelId"
              class="px-2.5 pb-1 font-mono text-xs uppercase tracking-[0.06em] text-muted"
            >
              {{ group.label }}
            </p>
          }
          @for (item of group.items; track item.key) {
            <a
              [routerLink]="item.route"
              routerLinkActive=""
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              [attr.data-testid]="'nav-link-' + item.key"
              (click)="navigate.emit()"
              class="group flex min-h-11 items-center gap-3 rounded-md px-2.5 text-[0.90625rem] text-muted transition-colors hover:bg-surface-elevated hover:text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
            >
              <app-icon
                [name]="item.icon"
                [size]="18"
                class="group-aria-[current=page]:text-primary"
              />
              <span class="flex-1">
                <span
                  class="group-aria-[current=page]:pb-0.5 group-aria-[current=page]:shadow-[inset_0_-2px_0_var(--color-primary)]"
                  >{{ item.label }}</span
                >
              </span>
              @if (item.count !== null) {
                <span
                  [attr.data-testid]="'nav-count-' + item.key"
                  class="font-mono text-xs font-normal tabular-nums"
                  [class.text-primary]="item.key === 'messages' && item.count > 0"
                  >{{ item.count }}
                  @if (item.countSuffix) {
                    <span class="sr-only">{{ item.countSuffix }}</span>
                  }
                </span>
              }
            </a>
          }
        </div>
      }
    </nav>

    <div class="grid gap-0.5 border-t border-line pt-2.5">
      <a
        href="/"
        target="_blank"
        rel="noopener"
        data-testid="admin-view-site"
        class="flex min-h-11 items-center gap-3 rounded-md px-2.5 text-[0.90625rem] text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <app-icon name="external-link" [size]="18" />
        <span>Voir le site<span class="sr-only"> (nouvel onglet)</span></span>
      </a>
      <button
        type="button"
        data-testid="admin-theme-toggle"
        (click)="themeToggle.emit()"
        class="flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 text-left text-[0.90625rem] text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <app-icon [name]="isDark() ? 'sun' : 'moon'" [size]="18" />
        <span>{{ themeToggleLabel() }}</span>
      </button>
      <button
        type="button"
        data-testid="admin-logout"
        (click)="logout.emit()"
        class="flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 text-left text-[0.90625rem] text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <app-icon name="sign-out" [size]="18" />
        <span>Se déconnecter</span>
      </button>
      @if (email()) {
        <p
          data-testid="admin-user-email"
          class="truncate px-2.5 pt-2.5 pb-0.5 font-mono text-xs text-muted"
        >
          {{ email() }}
        </p>
      }
    </div>
  `,
})
export class AdminNav {
  readonly groups = input.required<readonly AdminNavGroup[]>();
  readonly email = input<string>();
  readonly isDark = input.required<boolean>();

  readonly navigate = output<void>();
  readonly themeToggle = output<void>();
  readonly logout = output<void>();

  protected readonly idPrefix = `admin-nav-group-${nextNavId++}`;

  protected readonly themeToggleLabel = computed(() =>
    this.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre',
  );
}
