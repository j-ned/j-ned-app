import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '../domain';

@Component({
  selector: 'app-home-speciality',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @for (speciality of specialities(); track speciality.title) {
      <li class="space-y-3 text-center md:text-left">
        <h3 class="text-sm font-bold uppercase tracking-widest text-primary">
          {{ speciality.title }}
        </h3>
        <p class="text-base text-muted leading-relaxed">
          {{ speciality.description }}
        </p>
      </li>
    }
  `,
})
export class HomeSpeciality {
  private homeGateway = inject(HOME_GATEWAY);
  private specialitiesObservable = this.homeGateway.getSpecialities();
  protected readonly specialities = toSignal(this.specialitiesObservable, { initialValue: [] });
}
