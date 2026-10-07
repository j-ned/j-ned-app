import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthStore } from '@core/auth/auth-store';
import { ThemeStore } from '@core/theme/theme-store';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import { Drawer } from '@shared/ui/drawer';
import { AdminNav } from './components/admin-nav';
import { activeNavLabel, adminNavGroups } from './admin-nav-groups';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AppIcon, Drawer, AdminNav],
  host: { class: 'block min-h-svh lg:grid lg:grid-cols-[15.75rem_minmax(0,1fr)]' },
  template: `
    <div class="sticky top-0 hidden h-svh flex-col border-r border-line px-3.5 pt-5 pb-4 lg:flex">
      <div class="flex items-center gap-3 border-b border-line px-2 pb-[1.125rem]">
        <span
          aria-hidden="true"
          class="inline-grid size-10 shrink-0 place-items-center rounded-[0.625rem] border border-primary/30 bg-primary/12 font-display text-[0.9375rem] font-bold text-primary"
          >JN</span
        >
        <div>
          <p class="font-display text-[0.9375rem] leading-tight font-bold [font-stretch:104%]">
            Julien Nédellec
          </p>
          <p class="font-mono text-xs text-muted">Administration</p>
        </div>
      </div>
      <app-admin-nav
        class="flex-1"
        [groups]="groups()"
        [email]="email()"
        [isDark]="theme.isDark()"
        (themeToggle)="theme.toggle()"
        (logout)="auth.logout()"
      />
    </div>

    <div
      class="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-background py-2 pr-2 pl-4 lg:hidden"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          class="inline-grid size-[2.125rem] shrink-0 place-items-center rounded-[0.625rem] border border-primary/30 bg-primary/12 font-display text-[0.8125rem] font-bold text-primary"
          >JN</span
        >
        <span
          data-testid="admin-topbar-title"
          class="truncate font-display text-base font-bold [font-stretch:104%]"
          >{{ topbarTitle() }}</span
        >
      </div>
      <button
        type="button"
        data-testid="admin-menu-button"
        aria-controls="admin-drawer"
        [attr.aria-expanded]="menuOpen()"
        (click)="menuOpen.set(true)"
        class="inline-grid size-11 place-items-center rounded-md border border-transparent text-foreground transition-colors hover:border-line-strong hover:bg-surface-elevated"
      >
        <app-icon name="bars" [size]="18" />
        <span class="sr-only">Ouvrir le menu d'administration</span>
      </button>
    </div>

    <div class="min-w-0 px-4 pt-7 pb-24 text-[0.9375rem] lg:px-14 lg:pt-11 lg:pb-30">
      <div class="max-w-[72.5rem]">
        <router-outlet />
      </div>
    </div>

    <app-drawer
      id="admin-drawer"
      [(visible)]="menuOpen"
      position="left"
      heading="Administration"
      ariaLabel="Menu d'administration"
    >
      <app-admin-nav
        [groups]="groups()"
        [email]="email()"
        [isDark]="theme.isDark()"
        (navigate)="menuOpen.set(false)"
        (themeToggle)="theme.toggle()"
        (logout)="logoutFromDrawer()"
      />
    </app-drawer>
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AuthStore);
  protected readonly theme = inject(ThemeStore);
  private readonly _router = inject(Router);
  private readonly _projectsGateway = inject(ProjectsGateway);
  private readonly _blogGateway = inject(BlogGateway);
  private readonly _contactGateway = inject(ContactGateway);

  protected readonly menuOpen = signal(false);

  private readonly _projects = rxResource({ stream: () => this._projectsGateway.getAllProjects() });
  private readonly _posts = rxResource({ stream: () => this._blogGateway.getAllPostsForAdmin() });
  private readonly _unread = rxResource({ stream: () => this._contactGateway.getUnreadCount() });

  private readonly _url = toSignal(
    this._router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this._router.url },
  );

  protected readonly groups = computed(() =>
    adminNavGroups({
      projects: this._projects.hasValue() ? this._projects.value().length : null,
      posts: this._posts.hasValue() ? this._posts.value().length : null,
      unread: this._unread.hasValue() ? this._unread.value() : null,
    }),
  );

  protected readonly topbarTitle = computed(() => activeNavLabel(this.groups(), this._url()));

  protected readonly email = computed(() => this.auth.currentUser()?.email);

  protected logoutFromDrawer(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
