import { Component } from '@angular/core';
import { FaqList } from '@shared/ui/faq-list';
import { HOME_FAQ } from '../domain/home-pitch.static-data';

@Component({
  selector: 'app-home-faq',
  imports: [FaqList],
  host: { class: 'block' },
  template: `
    <app-faq-list
      headingId="home-faq-heading"
      [heading]="faq.heading"
      [lead]="faq.lead"
      [items]="faq.items"
    />
  `,
})
export class HomeFaq {
  protected readonly faq = HOME_FAQ;
}
