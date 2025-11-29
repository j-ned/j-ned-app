import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContactForm } from './contact-form';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContactForm],
  template: `
    <div class="min-h-screen pt-20">
      @defer (on viewport) {
        <app-contact-form />
      } @placeholder {
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div class="max-w-2xl mx-auto">
            <div
              class="h-96 bg-background/50 border border-foreground/10 rounded-2xl animate-pulse"
            ></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class Contact {}
