import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HOME_GATEWAY } from '../../core/home/gateways';

@Component({
  selector: 'app-home-speciality',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @for (speciality of specialities(); track speciality.title) {
      <div class="space-y-3 text-center md:text-left">
        <h2 class="text-sm font-bold uppercase tracking-widest text-primary">
          {{ speciality.title }}
        </h2>
        <p class="text-base text-muted leading-relaxed">
          {{ speciality.description }}
        </p>
      </div>
    }
  `,
})
export class HomeSpeciality {
  private homeGateway = inject(HOME_GATEWAY);
  private specialitiesObservable = this.homeGateway.getSpecialities();
  protected readonly specialities = toSignal(this.specialitiesObservable, { initialValue: [] });
}
