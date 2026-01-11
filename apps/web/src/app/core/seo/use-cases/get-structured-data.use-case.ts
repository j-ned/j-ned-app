import { inject, Injectable } from '@angular/core';
import { SEO_GATEWAY } from '../gateways';

@Injectable({ providedIn: 'root' })
export class GetStructuredDataUseCase {
  private gateway = inject(SEO_GATEWAY);

  execute(route: string): void {
    this.gateway.getStructuredDataForRoute(route).subscribe((data) => {
      if (data) {
        this.addStructuredData(data);
      }
    });
  }

  private addStructuredData(data: object): void {
    let script: HTMLScriptElement | null = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
