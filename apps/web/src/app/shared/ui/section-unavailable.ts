import { Component } from '@angular/core';

@Component({
  selector: 'app-section-unavailable',
  host: {
    role: 'status',
    'data-testid': 'section-unavailable',
    class: 'page-container block py-16 text-center text-sm text-muted',
  },
  template: `Cette section n'a pas pu être chargée. Recharge la page pour la retrouver.`,
})
export class SectionUnavailable {}
