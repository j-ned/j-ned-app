import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  updateMetaTags(data: SeoData): void {
    // Update title
    this.title.setTitle(data.title);

    // Update or add meta tags
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

    // Update canonical URL
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

  addStructuredData(data: object): void {
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
