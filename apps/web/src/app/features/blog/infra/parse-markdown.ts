import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

// `isomorphic-dompurify` : DOMPurify sur le DOM natif dans le navigateur, sur jsdom côté Node.
// Indispensable : les articles sont rendus au prérendu, et DOMPurify sans DOM réel renvoie la
// chaîne telle quelle (`isSupported === false`), ce qui figerait un payload dans le HTML statique.
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  // `style` inline peut recouvrir la page (position:fixed) : rien dans le blog n'en a besoin.
  FORBID_ATTR: ['style'],
};

/**
 * Markdown → HTML **assaini**. marked laisse passer le HTML inline tel quel (l'option `sanitize`
 * a disparu en v5) : c'est ici, et seulement ici, que le HTML devient digne de confiance pour
 * `bypassSecurityTrustHtml` (cf. ADR-0002).
 */
export function parseMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
}
