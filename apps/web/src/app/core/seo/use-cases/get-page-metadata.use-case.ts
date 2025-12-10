import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SEO_GATEWAY } from '../gateways';
import type { SeoMetadata } from '../models';

@Injectable({ providedIn: 'root' })
export class GetPageMetadataUseCase {
  private gateway = inject(SEO_GATEWAY);
  private title = inject(Title);
  private meta = inject(Meta);

  execute(route: string): void {
    this.gateway.getMetadataForRoute(route).subscribe((metadata) => {
      this.applyMetadata(metadata);
    });
  }

  private applyMetadata(data: SeoMetadata): void {
    this.title.setTitle(data.title);

    const tags = [
      { name: 'description', content: data.description },
      { name: 'keywords', content: data.keywords || '' },
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:type', content: data.type || 'website' },
      { property: 'og:url', content: data.url || 'https://www.julien-nedellec.fr' },
      {
        property: 'og:image',
        content: data.image || 'https://www.julien-nedellec.fr/photoProfil.webp',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description },
      {
        name: 'twitter:image',
        content: data.image || 'https://www.julien-nedellec.fr/photoProfil.webp',
      },
    ];

    tags.forEach((tag) => {
      if (tag.content) {
        if (tag.name) {
          this.meta.updateTag({ name: tag.name, content: tag.content });
        } else if (tag.property) {
          this.meta.updateTag({ property: tag.property, content: tag.content });
        }
      }
    });

    if (data.url) {
      this.updateCanonicalUrl(data.url);
    }
  }

  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
