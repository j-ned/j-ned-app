import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '../domain';

@Component({
  selector: 'app-home-speciality',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <ul
      class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-16 md:mb-14 pb-12 md:pb-14 border-b border-white/10 min-h-50 md:min-h-37.5"
      role="list"
    >
      @for (speciality of specialities(); track speciality.title) {
        <li class="space-y-3 text-center md:text-left">
          <h2 class="text-sm font-bold uppercase tracking-widest text-primary">
            {{ speciality.title }}
          </h2>
          <p class="text-base text-muted leading-relaxed">
            {{ speciality.description }}
          </p>
        </li>
      }
    </ul>
  `,
})
export class HomeSpeciality {
  private homeGateway = inject(HOME_GATEWAY);
  private specialitiesObservable = this.homeGateway.getSpecialities();
  protected readonly specialities = toSignal(this.specialitiesObservable, { initialValue: [] });
}
