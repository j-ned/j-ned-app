import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/domain/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen bg-background">
      <!-- Sidebar -->
      <aside
        class="flex flex-col border-r border-foreground/10 bg-background transition-all duration-300"
        [class.w-64]="!collapsed()"
        [class.w-20]="collapsed()"
      >
        <!-- Header -->
        <div class="p-4 border-b border-foreground/10">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 shrink-0 rounded-lg bg-linear-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center"
            >
              <svg class="w-5 h-5 text-primary" aria-hidden="true">
                <use href="/icons/sprite.svg#lucide-layout-dashboard" />
              </svg>
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

        <!-- Toggle button -->
        <div class="px-3 py-2">
          <button
            (click)="collapsed.set(!collapsed())"
            class="flex items-center justify-center w-full p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            [attr.title]="collapsed() ? 'Ouvrir le menu' : 'Réduire le menu'"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              @if (collapsed()) {
                <use href="/icons/sprite.svg#lucide-panel-left-open" />
              } @else {
                <use href="/icons/sprite.svg#lucide-panel-left-close" />
              }
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-2 space-y-1">
          <a
            routerLink="/admin"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Dashboard' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-layout-dashboard" />
            </svg>
            @if (!collapsed()) {
              <span>Dashboard</span>
            }
          </a>
          <a
            routerLink="/admin/projects"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Projets' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-laptop" />
            </svg>
            @if (!collapsed()) {
              <span>Projets</span>
            }
          </a>
          <a
            routerLink="/admin/articles"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Articles' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-notebook-pen" />
            </svg>
            @if (!collapsed()) {
              <span>Articles</span>
            }
          </a>
          <a
            routerLink="/admin/comments"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Commentaires' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-message-square" />
            </svg>
            @if (!collapsed()) {
              <span>Commentaires</span>
            }
          </a>
          <a
            routerLink="/admin/bookings"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Réservations' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-calendar" />
            </svg>
            @if (!collapsed()) {
              <span>Réservations</span>
            }
          </a>
          <a
            routerLink="/admin/availability"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Disponibilités' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-calendar-check" />
            </svg>
            @if (!collapsed()) {
              <span>Disponibilités</span>
            }
          </a>
          <a
            routerLink="/admin/messages"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Messages' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-mail" />
            </svg>
            @if (!collapsed()) {
              <span>Messages</span>
            }
          </a>
          <a
            routerLink="/admin/stats"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'Statistiques' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-bar-chart-3" />
            </svg>
            @if (!collapsed()) {
              <span>Statistiques</span>
            }
          </a>
          <a
            routerLink="/admin/cv"
            routerLinkActive="bg-primary/10 text-primary border-primary/30"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent transition-colors"
            [attr.title]="collapsed() ? 'CV' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-file-text" />
            </svg>
            @if (!collapsed()) {
              <span>CV</span>
            }
          </a>
        </nav>

        <!-- Footer -->
        <div class="px-3 py-4 border-t border-foreground/10 space-y-1">
          <a
            routerLink="/"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            [attr.title]="collapsed() ? 'Retour au site' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-home" />
            </svg>
            @if (!collapsed()) {
              <span>Retour au site</span>
            }
          </a>
          <button
            (click)="authService.logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            [attr.title]="collapsed() ? 'Déconnexion' : null"
          >
            <svg class="w-5 h-5 shrink-0" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-log-out" />
            </svg>
            @if (!collapsed()) {
              <span>Déconnexion</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 p-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayout {
  readonly authService = inject(AuthService);
  readonly collapsed = signal(false);
}
