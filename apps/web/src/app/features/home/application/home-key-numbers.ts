import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterNextRender,
  signal,
  viewChild,
} from '@angular/core';

type KeyNumber = {
  value: number;
  suffix: string;
  label: string;
  icon: string;
};

const KEY_NUMBERS: readonly KeyNumber[] = [
  { value: 20, suffix: '+', label: "Années d'expérience", icon: 'lucide-briefcase' },
  { value: 4, suffix: '+', label: 'Projets livrés', icon: 'lucide-laptop' },
  { value: 6, suffix: '', label: 'Technologies maîtrisées', icon: 'lucide-cpu' },
  { value: 100, suffix: '%', label: 'Self-hosted & déployé', icon: 'lucide-server' },
];

const DURATION = 1800;
const STAGGER = 200;

@Component({
  selector: 'app-home-key-numbers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block py-24 px-6 bg-white/5' },
  template: `
    <section #section class="max-w-5xl mx-auto">
      <ul class="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" role="list">
        @for (item of items; track item.label; let i = $index) {
          <li
            class="group relative flex flex-col items-center text-center gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-500"
            [class.translate-y-0]="visible()[i]"
            [class.opacity-100]="visible()[i]"
            [class.translate-y-6]="!visible()[i]"
            [class.opacity-0]="!visible()[i]"
            [style.transition-delay]="i * 150 + 'ms'"
          >
            <div
              class="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
            ></div>
            <div
              class="relative z-10 p-3 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 border border-primary/20 group-hover:border-primary/40 transition-colors duration-300"
            >
              <svg class="w-6 h-6 text-primary" aria-hidden="true">
                <use [attr.href]="'/icons/sprite.svg#' + item.icon" />
              </svg>
            </div>
            <data
              [attr.value]="displayValues()[i]"
              class="relative z-10 text-4xl lg:text-5xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent"
            >
              {{ displayValues()[i] }}{{ item.suffix }}
            </data>
            <p class="relative z-10 text-sm text-muted leading-tight">{{ item.label }}</p>
          </li>
        }
      </ul>
    </section>
  `,
})
export class HomeKeyNumbers {
  protected readonly items = KEY_NUMBERS;
  protected readonly displayValues = signal<readonly number[]>(KEY_NUMBERS.map(() => 0));
  protected readonly visible = signal<readonly boolean[]>(KEY_NUMBERS.map(() => false));

  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('section');
  private hasAnimated = false;

  constructor() {
    afterNextRender(() => {
      const el = this.sectionRef()?.nativeElement;
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            observer.disconnect();
            this.reveal();
            this.animateCounters();
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(el);
    });
  }

  private reveal(): void {
    KEY_NUMBERS.forEach((_, i) => {
      setTimeout(() => {
        this.visible.update((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 150);
    });
  }

  private animateCounters(): void {
    KEY_NUMBERS.forEach((item, i) => {
      const delay = i * STAGGER;

      setTimeout(() => {
        const start = performance.now();

        const step = (now: number): void => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 4);

          this.displayValues.update((prev) => {
            const next = [...prev];
            next[i] = Math.round(eased * item.value);
            return next;
          });

          if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      }, delay);
    });
  }
}
