import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export type SeoData = {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: string;
  structuredData?: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class Seo {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  applySeoData(data: SeoData): void {
    this.title.setTitle(data.title);

    this.meta.updateTag({ name: 'description', content: data.description });
    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.meta.updateTag({
      property: 'og:url',
      content: data.url || 'https://www.julien-nedellec.fr',
    });
    this.meta.updateTag({
      property: 'og:image',
      content: data.image || 'https://www.julien-nedellec.fr/photoProfil.webp',
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({
      name: 'twitter:image',
      content: data.image || 'https://www.julien-nedellec.fr/photoProfil.webp',
    });

    if (data.url) {
      this.updateCanonicalUrl(data.url);
    }

    if (data.structuredData) {
      this.addStructuredData(data.structuredData);
    }
  }

  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private addStructuredData(data: Record<string, unknown>): void {
    let script: HTMLScriptElement | null = this.document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
