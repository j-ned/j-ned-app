export type CspBuildManifest = {
  readonly scriptHashes: readonly string[];
  readonly styleElementHashes: readonly string[];
  readonly styleAttrHashes: readonly string[];
};

type Sha256 = (text: string) => string;

const CSP_META = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*)(")/;
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
const JSON_SCRIPT_TYPE = /\btype="application\/(ld\+)?json"/;
const STYLE_ELEMENT = /<style[^>]*>([\s\S]*?)<\/style>/g;
const STYLE_ATTR = /\sstyle="([^"]*)"/g;
const HEAD = /<head[^>]*>([\s\S]*?)<\/head>/;
// Contenu textuel où un `<style>` n'est pas un élément (JSON-LD, titre) : retiré avant la recherche.
const TEXT_ONLY_ELEMENT = /<(script|noscript|title|template)\b[^>]*>[\s\S]*?<\/\1>/g;
const HASH_SOURCE = /^'sha256-/;

// Seule forme admise sans manifeste : la liste d'événements de l'event replay varie par page.
const EVENT_REPLAY_BOOTSTRAP =
  /^window\.__jsaction_bootstrap\(document\.body,"ng",\[("[a-z]+"(,"[a-z]+")*)?\],\[("[a-z]+"(,"[a-z]+")*)?\]\);$/;

const unique = (values: Iterable<string>): string[] => [...new Set(values)];

function capture(match: RegExpMatchArray, group: number): string {
  const value = match[group];
  if (value === undefined)
    throw new Error(`Capture group ${group} did not participate in the match`);
  return value;
}

function executableScripts(html: string): string[] {
  return [...html.matchAll(INLINE_SCRIPT)]
    .filter((match) => !JSON_SCRIPT_TYPE.test(capture(match, 1)))
    .map((match) => capture(match, 2));
}

const styleElements = (html: string): string[] =>
  [...html.matchAll(STYLE_ELEMENT)].map((match) => capture(match, 1));

const styleAttrs = (html: string): string[] =>
  [...html.matchAll(STYLE_ATTR)].map((match) => capture(match, 1));

// Les hachages d'un passage précédent sont retirés puis recalculés : la fonction est idempotente.
function withHashes(name: string, directive: string, hashes: readonly string[]): string {
  const sources = directive.split(/\s+/).slice(1);
  const kept = sources.filter((s) => s !== "'unsafe-inline'" && !HASH_SOURCE.test(s));
  return unique([name, ...kept, ...hashes]).join(' ');
}

export function buildCspManifest(pages: Iterable<string>, sha256: Sha256): CspBuildManifest {
  const scripts = new Set<string>();
  const elements = new Set<string>();
  const attrs = new Set<string>();
  for (const html of pages) {
    for (const body of executableScripts(html)) {
      if (!EVENT_REPLAY_BOOTSTRAP.test(body)) scripts.add(sha256(body));
    }
    for (const css of styleElements(html)) elements.add(sha256(css));
    for (const css of styleAttrs(html)) attrs.add(sha256(css));
  }
  return {
    scriptHashes: [...scripts],
    styleElementHashes: [...elements],
    styleAttrHashes: [...attrs],
  };
}

export function hardenCsp(
  html: string,
  manifest: CspBuildManifest,
  sha256: Sha256,
  onRejectedScript: (script: string) => void = () => undefined,
): string {
  const meta = CSP_META.exec(html);
  if (!meta) throw new Error('No Content-Security-Policy meta in the page');

  const allowedScripts = new Set(manifest.scriptHashes);
  const scriptHashes: string[] = [];
  for (const body of executableScripts(html)) {
    const hash = sha256(body);
    if (allowedScripts.has(hash) || EVENT_REPLAY_BOOTSTRAP.test(body)) scriptHashes.push(hash);
    else onRejectedScript(body);
  }
  // Neutralisés sur toute la page d'abord : un `</head>` écrit dans du JSON-LD couperait l'extraction.
  const head = HEAD.exec(html.replace(TEXT_ONLY_ELEMENT, ''))?.[1] ?? '';
  const headStyles = styleElements(head).map(sha256);
  const styleHashes = [...manifest.styleElementHashes, ...headStyles];
  const styleAttrHashes = unique([...manifest.styleAttrHashes, ...styleAttrs(html).map(sha256)]);

  const directives = capture(meta, 2)
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d && !d.startsWith('style-src-attr '))
    .map((d) => {
      if (d.startsWith('script-src ')) return withHashes('script-src', d, scriptHashes);
      if (d.startsWith('style-src ')) return withHashes('style-src', d, styleHashes);
      return d;
    });
  if (styleAttrHashes.length > 0) {
    directives.push(["style-src-attr 'unsafe-hashes'", ...styleAttrHashes].join(' '));
  }
  return html.replace(
    CSP_META,
    () => `${capture(meta, 1)}${directives.join('; ')};${capture(meta, 3)}`,
  );
}
