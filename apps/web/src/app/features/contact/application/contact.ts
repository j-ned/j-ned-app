import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContactForm } from './contact-form';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [ContactForm],
  template: `
    <div class="min-h-screen pt-20">
      <app-contact-form />
    </div>
  `,
})
export class Contact {}
