import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { SPECIALITIES } from './data/home.data';

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
  protected readonly specialities = signal(SPECIALITIES);
}
