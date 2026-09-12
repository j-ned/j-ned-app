import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { SHARE_IMAGE } from './share-image';

export type SeoData = {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  /** Carte de partage JPEG 1200×630 (`toShareImageUrl`). Sans visuel : l'avatar PNG. */
  image?: string;
  /** Texte alternatif du visuel partagé (`og:image:alt`). Défaut : le titre. */
  imageAlt?: string;
  type?: string;
  structuredData?: Record<string, unknown>;
};

// Mêmes valeurs que les balises statiques de index.html, que ce service remplace page par page.
// L'avatar est servi en PNG : les crawlers sociaux ne décodent pas l'AVIF affiché sur la page.
const AVATAR_IMAGE = {
  url: `${SITE_IDENTITY.siteUrl}/avatar.png`,
  width: 400,
  height: 400,
  type: 'image/png',
} as const;
const AVATAR_ALT = 'Photo de profil de Julien Nédellec';

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
      content: data.url || SITE_IDENTITY.siteUrl,
    });
    // Sans visuel dédié (couverture d'article, image de projet), on retombe sur l'avatar 400×400 :
    // une carte `summary` l'affiche en vignette, une `summary_large_image` l'étirerait.
    const image = data.image
      ? { url: data.image, ...SHARE_IMAGE, alt: data.imageAlt || data.title }
      : { ...AVATAR_IMAGE, alt: AVATAR_ALT };
    this.meta.updateTag({ property: 'og:image', content: image.url });
    this.meta.updateTag({ property: 'og:image:alt', content: image.alt });
    this.meta.updateTag({ property: 'og:image:width', content: String(image.width) });
    this.meta.updateTag({ property: 'og:image:height', content: String(image.height) });
    this.meta.updateTag({ property: 'og:image:type', content: image.type });

    this.meta.updateTag({
      name: 'twitter:card',
      content: data.image ? 'summary_large_image' : 'summary',
    });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: image.url });
    this.meta.updateTag({ name: 'twitter:image:alt', content: image.alt });

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
