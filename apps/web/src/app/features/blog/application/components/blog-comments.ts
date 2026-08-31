import { Component, ElementRef, afterNextRender, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { GISCUS_CONFIG } from '@shared/api/giscus-config';

@Component({
  selector: 'app-blog-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mt-12' },
  template: `<div #container></div>`,
})
export class BlogComments {
  readonly slug = input.required<string>();
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly config = inject(GISCUS_CONFIG);

  constructor() {
    afterNextRender(() => {
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', this.config.repo);
      script.setAttribute('data-repo-id', this.config.repoId);
      script.setAttribute('data-category', this.config.category);
      script.setAttribute('data-category-id', this.config.categoryId);
      script.setAttribute('data-mapping', 'pathname');
      script.setAttribute('data-reactions-enabled', '0');
      script.setAttribute('data-theme', 'preferred_color_scheme');
      script.crossOrigin = 'anonymous';
      script.async = true;
      this.host.nativeElement.appendChild(script);
    });
  }
}
