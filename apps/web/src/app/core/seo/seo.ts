import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { DEFAULT_SHARE_IMAGE, SHARE_IMAGE } from '@shared/seo/share-image';

export type SeoData = {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  /** Carte de partage JPEG 1200×630 (`toShareImageUrl`). Sans visuel : la carte PNG par défaut. */
  image?: string;
  /** Texte alternatif du visuel partagé (`og:image:alt`). Défaut : le titre. */
  imageAlt?: string;
  type?: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
};

const DEFAULT_ROBOTS = 'index, follow';

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
    // Rétabli à chaque page : sinon une navigation client depuis une page `noindex` la propage.
    this.meta.updateTag({ name: 'robots', content: data.robots || DEFAULT_ROBOTS });

    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.meta.updateTag({
      property: 'og:url',
      content: data.url || SITE_IDENTITY.siteUrl,
    });
    const image = data.image
      ? { url: data.image, ...SHARE_IMAGE, alt: data.imageAlt || data.title }
      : DEFAULT_SHARE_IMAGE;
    this.meta.updateTag({ property: 'og:image', content: image.url });
    this.meta.updateTag({ property: 'og:image:alt', content: image.alt });
    this.meta.updateTag({ property: 'og:image:width', content: String(image.width) });
    this.meta.updateTag({ property: 'og:image:height', content: String(image.height) });
    this.meta.updateTag({ property: 'og:image:type', content: image.type });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

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
