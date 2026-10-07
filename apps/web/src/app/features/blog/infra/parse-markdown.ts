import DOMPurify from 'isomorphic-dompurify';
import { Marked, type Tokens } from 'marked';
import { slugifyHeading } from './heading-slug';

// `isomorphic-dompurify` : DOMPurify sur le DOM natif dans le navigateur, sur jsdom côté Node.
// Indispensable : les articles sont rendus au prérendu, et DOMPurify sans DOM réel renvoie la
// chaîne telle quelle (`isSupported === false`), ce qui figerait un payload dans le HTML statique.
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  // `style` inline peut recouvrir la page (position:fixed) : rien dans le blog n'en a besoin.
  FORBID_ATTR: ['style'],
};

// Ids des titres déjà attribués dans l'article en cours : deux titres identiques donnent
// `mon-titre` puis `mon-titre-2`. Remis à zéro à chaque `parse` par le hook `preprocess`.
const usedHeadingIds = new Map<string, number>();

// État de l'appel en cours : `parse` est synchrone et `walkTokens` parcourt tout avant le rendu.
let topHeadingLevel = 1;
let highestHeadingDepth = 6;

function uniqueHeadingId(text: string): string {
  const base = slugifyHeading(text) || 'section';
  const count = (usedHeadingIds.get(base) ?? 0) + 1;
  usedHeadingIds.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  hooks: {
    preprocess(markdown: string): string {
      usedHeadingIds.clear();
      highestHeadingDepth = 6;
      return markdown;
    },
  },
  walkTokens(token): void {
    if (token.type === 'heading') highestHeadingDepth = Math.min(highestHeadingDepth, token.depth);
  },
  renderer: {
    // Ancre stable par titre (`#aes-256-gcm-un-iv-unique`) : liens profonds et sommaire possibles.
    heading({ tokens, depth }: Tokens.Heading): string {
      const id = uniqueHeadingId(this.parser.parseInline(tokens, this.parser.textRenderer));
      const shift = Math.max(0, topHeadingLevel - highestHeadingDepth);
      const level = Math.min(depth + shift, 6);
      return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
  },
});

/**
 * Markdown → HTML **assaini**. marked laisse passer le HTML inline tel quel (l'option `sanitize`
 * a disparu en v5) : c'est ici, et seulement ici, que le HTML devient digne de confiance pour
 * `bypassSecurityTrustHtml` (cf. ADR-0002).
 */
export function parseMarkdown(
  markdown: string,
  options: { topHeadingLevel?: number } = {},
): string {
  topHeadingLevel = options.topHeadingLevel ?? 1;
  const html = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
}
