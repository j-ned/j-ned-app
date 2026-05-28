import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from '../../auth/infra';
import { ContactGateway } from '@features/contact/domain';
import { AppIcon } from '@shared/icons';
import { Drawer, AppIconTile } from '@shared/ui';
import { AdminNav, type AdminNavItem } from './components/admin-nav';

@Component({
  selector: 'admin-layout',
  imports: [RouterOutlet, AppIcon, Drawer, AdminNav, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-svh bg-background flex flex-col md:flex-row">
      <!-- Desktop sidebar (md+) -->
      <aside
        class="hidden md:flex md:flex-col border-r border-foreground/10 bg-background transition-all duration-300"
        [class.md:w-64]="!collapsed()"
        [class.md:w-20]="collapsed()"
      >
        <admin-nav
          [collapsed]="collapsed()"
          [showCollapseButton]="true"
          [displayName]="authService.currentUser()?.displayName"
          [navItems]="navItems"
          (collapseToggle)="collapsed.set(!collapsed())"
          (logoutClick)="authService.logout()"
        />
      </aside>

      <!-- Mobile header (< md) : brand + hamburger -->
      <header
        class="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-foreground/10 bg-background"
      >
        <div class="flex items-center gap-2">
          <app-icon-tile size="sm" class="bg-primary/10 border border-primary/30">
            <app-icon name="th-large" [size]="16" class="text-primary" />
          </app-icon-tile>
          <span class="text-base font-bold text-foreground">Admin</span>
        </div>
        <button
          type="button"
          (click)="mobileMenuOpen.set(true)"
          aria-label="Ouvrir le menu de navigation"
          [attr.aria-expanded]="mobileMenuOpen()"
          class="inline-flex items-center justify-center w-11 h-11 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <app-icon name="bars" [size]="20" />
        </button>
      </header>

      <main class="flex-1 p-4 md:p-8 overflow-y-auto">
        <router-outlet />
      </main>
    </div>

    <!-- Mobile drawer (overlay, position fixed) -->
    <app-drawer
      [(visible)]="mobileMenuOpen"
      position="left"
      heading="Admin"
      ariaLabel="Menu de navigation admin"
    >
      <admin-nav
        [collapsed]="false"
        [showCollapseButton]="false"
        [displayName]="authService.currentUser()?.displayName"
        [navItems]="navItems"
        (logoutClick)="onMobileLogout()"
        (navigate)="mobileMenuOpen.set(false)"
      />
    </app-drawer>
  `,
})
export class AdminLayout {
  protected readonly authService = inject(AuthStore);
  private readonly _contactGateway = inject(ContactGateway);

  protected readonly collapsed = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  private readonly _unreadRes = rxResource({
    stream: () => this._contactGateway.getUnreadCount(),
  });

  private readonly _inboxCount = computed(() => this._unreadRes.value() ?? 0);

  protected readonly navItems: readonly AdminNavItem[] = [
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

  protected onMobileLogout(): void {
    this.mobileMenuOpen.set(false);
    this.authService.logout();
  }
}
