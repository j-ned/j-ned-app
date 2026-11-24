import { Component, input, output } from '@angular/core';
import { Button } from '@shared/ui/button';

// Affichés une seule fois, juste après l'activation : l'API ne garde que leurs empreintes.
@Component({
  selector: 'app-two-factor-backup-codes',
  imports: [Button],
  host: { class: 'block' },
  template: `
    <section
      aria-labelledby="twofa-backup-codes-title"
      class="bg-background/80 border border-status-warn/40 rounded-2xl p-8 space-y-4"
    >
      <h2 id="twofa-backup-codes-title" class="text-xl font-bold text-foreground">
        Codes de secours
      </h2>
      <p class="text-muted text-sm">
        Note-les en lieu sûr : chacun permet une seule connexion si tu perds ton application
        d'authentification. Ils ne seront plus affichés.
      </p>
      <ol class="grid grid-cols-2 gap-2 font-mono text-sm select-all">
        @for (code of codes(); track code) {
          <li
            data-testid="twofa-backup-code"
            class="p-2 rounded-lg bg-foreground/5 border border-foreground/20 text-center text-foreground"
          >
            {{ code }}
          </li>
        }
      </ol>
      <button
        appButton
        type="button"
        [block]="true"
        data-testid="twofa-backup-codes-done"
        (click)="acknowledged.emit()"
      >
        J'ai noté mes codes
      </button>
    </section>
  `,
})
export class TwoFactorBackupCodes {
  readonly codes = input.required<readonly string[]>();
  readonly acknowledged = output<void>();
}
