import { Component, input } from '@angular/core';
import type { BuildStep } from '../domain/models/build-step.model';
import type { HomeHighlight } from '../domain/models/home-highlight.model';

// Grille dense : md = 2 colonnes (pipeline sur 2, puis 2×2) ; xl = 4×2 (pipeline 2×2 + 4 tuiles).
// 4 + 4 = 8 cases sur 8 : aucune case vide tant qu'il y a exactement 4 domaines.
@Component({
  selector: 'app-home-proof',
  host: { class: 'block' },
  template: `
    <section class="page-container py-24 md:py-32" aria-labelledby="proof-heading">
      <header class="grid gap-4 mb-12 lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2 id="proof-heading" class="section-title">Ce que je maîtrise, vérifiable sur ce site</h2>
        <p class="max-w-[52ch] text-muted">
          Quatre domaines, avec pour chacun ce qui tourne réellement ici. Le code est public :
          chaque point se contrôle en quelques minutes.
        </p>
      </header>

      <div class="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          class="flex flex-col gap-3.5 rounded-xl border border-foreground/8 bg-surface p-6 transition-colors duration-300 hover:border-primary/35 hover:bg-surface-elevated md:col-span-2 xl:row-span-2"
          data-testid="home-proof-pipeline"
        >
          <h3 class="text-xl font-semibold tracking-tight">Du build au navigateur</h3>
          <p class="text-[0.9375rem] text-muted">
            Le chemin d'une page publique, de la CI jusqu'à l'interaction. Aucune route publique
            n'attend un serveur Node pour s'afficher.
          </p>
          <ol class="mt-2 flex flex-col" role="list">
            @for (step of buildSteps(); track step.id; let last = $last) {
              <li class="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3.5 pb-4.5 last:pb-0">
                <span
                  class="relative z-10 mt-1.5 ml-1 size-2.75 rounded-full border-2 border-primary bg-background"
                  aria-hidden="true"
                ></span>
                @if (!last) {
                  <span
                    class="absolute left-2.25 top-4.5 bottom-0 w-px bg-foreground/15"
                    aria-hidden="true"
                  ></span>
                }
                <div>
                  <p class="font-mono text-[0.8125rem] font-semibold">{{ step.command }}</p>
                  <p class="text-sm leading-normal text-muted">{{ step.description }}</p>
                </div>
              </li>
            }
          </ol>
        </article>

        @for (item of highlights(); track item.id) {
          <article
            class="flex flex-col gap-3.5 rounded-xl border border-foreground/8 bg-surface p-6 transition-colors duration-300 hover:border-primary/35 hover:bg-surface-elevated"
            data-testid="home-proof-tile"
          >
            <h3 class="text-xl font-semibold tracking-tight">{{ item.title }}</h3>
            <p class="text-[0.9375rem] text-muted">{{ item.description }}</p>
            <dl class="mt-auto flex flex-col gap-2 border-t border-foreground/8 pt-3.5">
              @for (fact of item.facts; track fact.label) {
                <div class="flex justify-between gap-3 font-mono text-[0.8125rem] leading-snug">
                  <dt class="text-muted">{{ fact.label }}</dt>
                  <dd class="text-right">{{ fact.value }}</dd>
                </div>
              }
            </dl>
          </article>
        }
      </div>
    </section>
  `,
})
export class HomeProof {
  readonly highlights = input.required<readonly HomeHighlight[]>();
  readonly buildSteps = input.required<readonly BuildStep[]>();
}
