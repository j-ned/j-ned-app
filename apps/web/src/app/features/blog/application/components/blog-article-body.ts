import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { parseMarkdown } from '../../infra/parse-markdown';

@Component({
  selector: 'app-blog-article-body',
  host: { class: 'block' },
  template: `
    <div
      data-testid="blog-content"
      class="prose prose-lg max-w-none break-words dark:prose-invert prose-headings:tracking-tight prose-headings:text-foreground prose-h2:scroll-mt-24 prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-primary prose-a:underline-offset-3 prose-code:rounded-sm prose-code:bg-foreground/6 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-primary prose-code:before:content-none prose-code:after:content-none [&_u]:decoration-foreground/40 [&_u]:decoration-2 [&_u]:underline-offset-[0.3em] prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-img:h-auto prose-img:max-w-full"
      [innerHTML]="html()"
    ></div>
  `,
})
export class BlogArticleBody {
  private readonly sanitizer = inject(DomSanitizer);

  readonly markdown = input.required<string>();
  readonly topHeadingLevel = input(1);

  // Sortie déjà assainie : `parseMarkdown` est le seul point d'assainissement du Markdown.
  protected readonly html = computed(
    (): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(
        parseMarkdown(this.markdown(), {
          topHeadingLevel: this.topHeadingLevel(),
          codeCopyButton: true,
        }),
      ),
  );
}
