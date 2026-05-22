/**
 * Mapping de tokens (Lucide-style ou court) vers Font Awesome.
 * Utilisé par `<app-icon name="...">` et `scripts/build-icons.mjs`.
 *
 * Pour ajouter une nouvelle icône :
 *   1. Ajouter l'entrée ici (style: solid | brands | regular)
 *   2. Lancer `pnpm icons:build` pour régénérer le sprite
 *   3. Vérifier que `pnpm icons:check` passe
 */

export type FaStyle = 'solid' | 'brands' | 'regular';

export type IconRef = {
  readonly id: string;
  readonly style: FaStyle;
};

const FALLBACK: IconRef = { id: 'question', style: 'solid' };

export const ICON_MAP: Readonly<Record<string, IconRef>> = {
  // ─── Navigation & layout ──────────────────────────────
  'arrow-left':                 { id: 'arrow-left', style: 'solid' },
  'lucide-arrow-left':          { id: 'arrow-left', style: 'solid' },
  'arrow-right':                { id: 'arrow-right', style: 'solid' },
  'lucide-arrow-right':         { id: 'arrow-right', style: 'solid' },
  'arrow-right-arrow-left':     { id: 'right-left', style: 'solid' },
  'angles-left':                { id: 'angles-left', style: 'solid' },
  'lucide-panel-left-close':    { id: 'angles-left', style: 'solid' },
  'angles-right':               { id: 'angles-right', style: 'solid' },
  'lucide-panel-left-open':     { id: 'angles-right', style: 'solid' },
  'chevron-left':               { id: 'chevron-left', style: 'solid' },
  'lucide-chevron-left':        { id: 'chevron-left', style: 'solid' },
  'chevron-right':              { id: 'chevron-right', style: 'solid' },
  'lucide-chevron-right':       { id: 'chevron-right', style: 'solid' },
  'chevron-down':               { id: 'chevron-down', style: 'solid' },
  'bars':                       { id: 'bars', style: 'solid' },
  'lucide-menu':                { id: 'bars', style: 'solid' },
  'th-large':                   { id: 'table-cells-large', style: 'solid' },
  'lucide-layout-dashboard':    { id: 'table-cells-large', style: 'solid' },
  'home':                       { id: 'house', style: 'solid' },
  'lucide-home':                { id: 'house', style: 'solid' },
  'external-link':              { id: 'up-right-from-square', style: 'solid' },
  'lucide-external-link':       { id: 'up-right-from-square', style: 'solid' },

  // ─── Communication ────────────────────────────────────
  'envelope':                   { id: 'envelope', style: 'solid' },
  'mail':                       { id: 'envelope', style: 'solid' },
  'lucide-mail':                { id: 'envelope', style: 'solid' },
  'phone':                      { id: 'phone', style: 'solid' },
  'lucide-phone':               { id: 'phone', style: 'solid' },
  'send':                       { id: 'paper-plane', style: 'solid' },
  'paper-plane':                { id: 'paper-plane', style: 'solid' },
  'lucide-send':                { id: 'paper-plane', style: 'solid' },
  'lucide-rocket':              { id: 'paper-plane', style: 'solid' },
  'lucide-ship':                { id: 'paper-plane', style: 'solid' },
  'comment':                    { id: 'comment', style: 'solid' },
  'lucide-message-square':      { id: 'comment', style: 'solid' },
  'at':                         { id: 'at', style: 'solid' },
  'lucide-at-sign':             { id: 'at', style: 'solid' },

  // ─── Brands (logos) ───────────────────────────────────
  'github':                     { id: 'github', style: 'brands' },
  'lucide-github':              { id: 'github', style: 'brands' },
  'discord':                    { id: 'discord', style: 'brands' },
  'bi-discord':                 { id: 'discord', style: 'brands' },
  'lucide-discord':             { id: 'discord', style: 'brands' },
  'twitter':                    { id: 'x-twitter', style: 'brands' },
  'bi-twitter-x':               { id: 'x-twitter', style: 'brands' },
  'lucide-twitter':             { id: 'x-twitter', style: 'brands' },
  'linkedin':                   { id: 'linkedin', style: 'brands' },
  'lucide-linkedin':            { id: 'linkedin', style: 'brands' },
  'youtube':                    { id: 'youtube', style: 'brands' },
  'lucide-youtube':             { id: 'youtube', style: 'brands' },
  'instagram':                  { id: 'instagram', style: 'brands' },
  'lucide-instagram':           { id: 'instagram', style: 'brands' },
  'facebook':                   { id: 'facebook', style: 'brands' },
  'lucide-facebook':            { id: 'facebook', style: 'brands' },
  'whatsapp':                   { id: 'whatsapp', style: 'brands' },
  'lucide-whatsapp':            { id: 'whatsapp', style: 'brands' },
  'slack':                      { id: 'slack', style: 'brands' },
  'lucide-slack':               { id: 'slack', style: 'brands' },
  'telegram':                   { id: 'telegram', style: 'brands' },
  'lucide-telegram':            { id: 'telegram', style: 'brands' },

  // ─── Status & feedback ────────────────────────────────
  'check':                      { id: 'check', style: 'solid' },
  'lucide-check':               { id: 'check', style: 'solid' },
  'check-circle':               { id: 'circle-check', style: 'solid' },
  'circle-check':               { id: 'circle-check', style: 'solid' },
  'lucide-badge-check':         { id: 'circle-check', style: 'solid' },
  'verified':                   { id: 'circle-check', style: 'solid' },
  'valid':                      { id: 'circle-check', style: 'solid' },
  'lucide-medal':               { id: 'circle-check', style: 'solid' },
  'times':                      { id: 'xmark', style: 'solid' },
  'xmark':                      { id: 'xmark', style: 'solid' },
  'lucide-x':                   { id: 'xmark', style: 'solid' },
  'times-circle':               { id: 'circle-xmark', style: 'solid' },
  'circle-xmark':               { id: 'circle-xmark', style: 'solid' },
  'info-circle':                { id: 'circle-info', style: 'solid' },
  'circle-info':                { id: 'circle-info', style: 'solid' },
  'exclamation-triangle':       { id: 'triangle-exclamation', style: 'solid' },
  'triangle-exclamation':       { id: 'triangle-exclamation', style: 'solid' },
  'spinner':                    { id: 'spinner', style: 'solid' },
  'lucide-loader-2':            { id: 'spinner', style: 'solid' },
  'spinners':                   { id: 'spinner', style: 'solid' },

  // ─── Sort & filter ────────────────────────────────────
  'sort':                       { id: 'sort', style: 'solid' },
  'sort-up-fill':               { id: 'sort-up', style: 'solid' },
  'sort-down-fill':             { id: 'sort-down', style: 'solid' },
  'search':                     { id: 'magnifying-glass', style: 'solid' },
  'magnifying-glass':           { id: 'magnifying-glass', style: 'solid' },
  'lucide-search':              { id: 'magnifying-glass', style: 'solid' },
  'lucide-scan':                { id: 'magnifying-glass', style: 'solid' },
  'search-plus':                { id: 'magnifying-glass-plus', style: 'solid' },
  'lucide-binoculars':          { id: 'magnifying-glass-plus', style: 'solid' },
  'lucide-telescope':           { id: 'magnifying-glass-plus', style: 'solid' },

  // ─── Files & data ─────────────────────────────────────
  'file':                       { id: 'file', style: 'solid' },
  'lucide-file-text':           { id: 'file', style: 'solid' },
  'file-pdf':                   { id: 'file-pdf', style: 'solid' },
  'download':                   { id: 'download', style: 'solid' },
  'lucide-download':            { id: 'download', style: 'solid' },
  'upload':                     { id: 'upload', style: 'solid' },
  'cloud':                      { id: 'cloud', style: 'solid' },
  'lucide-cloud':               { id: 'cloud', style: 'solid' },
  'cloud-upload':               { id: 'cloud-arrow-up', style: 'solid' },
  'lucide-cloud-upload':        { id: 'cloud-arrow-up', style: 'solid' },
  'cloud-download':             { id: 'cloud-arrow-down', style: 'solid' },
  'lucide-cloud-download':      { id: 'cloud-arrow-down', style: 'solid' },
  'database':                   { id: 'database', style: 'solid' },
  'lucide-database':            { id: 'database', style: 'solid' },
  'server':                     { id: 'server', style: 'solid' },
  'lucide-server':              { id: 'server', style: 'solid' },
  'clipboard':                  { id: 'clipboard', style: 'solid' },
  'lucide-clipboard-check':     { id: 'clipboard', style: 'solid' },
  'lucide-clipboard-list':      { id: 'clipboard', style: 'solid' },
  'check-square':               { id: 'square-check', style: 'solid' },
  'lucide-list-checks':         { id: 'square-check', style: 'solid' },

  // ─── UI / actions ─────────────────────────────────────
  'pencil':                     { id: 'pencil', style: 'solid' },
  'lucide-pen-line':            { id: 'pencil', style: 'solid' },
  'lucide-notebook-pen':        { id: 'pencil', style: 'solid' },
  'trash':                      { id: 'trash', style: 'solid' },
  'lucide-trash-2':             { id: 'trash', style: 'solid' },
  'plus':                       { id: 'plus', style: 'solid' },
  'eye':                        { id: 'eye', style: 'solid' },
  'lucide-eye':                 { id: 'eye', style: 'solid' },
  'cog':                        { id: 'gear', style: 'solid' },
  'gear':                       { id: 'gear', style: 'solid' },
  'lucide-cog':                 { id: 'gear', style: 'solid' },
  'lucide-settings':            { id: 'gear', style: 'solid' },
  'lock':                       { id: 'lock', style: 'solid' },
  'lucide-lock':                { id: 'lock', style: 'solid' },
  'shield':                     { id: 'shield-halved', style: 'solid' },
  'shield-halved':              { id: 'shield-halved', style: 'solid' },
  'lucide-shield-check':        { id: 'shield-halved', style: 'solid' },
  'lucide-shield-user':         { id: 'shield-halved', style: 'solid' },
  'sign-out':                   { id: 'right-from-bracket', style: 'solid' },
  'lucide-log-out':             { id: 'right-from-bracket', style: 'solid' },
  'share-alt':                  { id: 'share-nodes', style: 'solid' },
  'lucide-share-2':             { id: 'share-nodes', style: 'solid' },

  // ─── User & people ────────────────────────────────────
  'user':                       { id: 'user', style: 'solid' },
  'lucide-user':                { id: 'user', style: 'solid' },
  'users':                      { id: 'users', style: 'solid' },
  'lucide-users':               { id: 'users', style: 'solid' },

  // ─── Time & calendar ──────────────────────────────────
  'clock':                      { id: 'clock', style: 'solid' },
  'lucide-clock':               { id: 'clock', style: 'solid' },

  // ─── Tech & dev ───────────────────────────────────────
  'code':                       { id: 'code', style: 'solid' },
  'lucide-code-xml':            { id: 'code', style: 'solid' },
  'desktop':                    { id: 'desktop', style: 'solid' },
  'lucide-laptop':              { id: 'desktop', style: 'solid' },
  'microchip':                  { id: 'microchip', style: 'solid' },
  'lucide-cpu':                 { id: 'microchip', style: 'solid' },
  'clone':                      { id: 'layer-group', style: 'solid' },
  'lucide-layers':              { id: 'layer-group', style: 'solid' },
  'sitemap':                    { id: 'sitemap', style: 'solid' },
  'lucide-sitemap':             { id: 'sitemap', style: 'solid' },
  'lucide-network':             { id: 'sitemap', style: 'solid' },
  'lucide-workflow':            { id: 'sitemap', style: 'solid' },
  'spider-web':                 { id: 'sitemap', style: 'solid' },
  'wifi':                       { id: 'wifi', style: 'solid' },
  'lucide-wifi':                { id: 'wifi', style: 'solid' },
  'globe':                      { id: 'globe', style: 'solid' },
  'lucide-globe':               { id: 'globe', style: 'solid' },
  'wrench':                     { id: 'wrench', style: 'solid' },
  'lucide-wrench':              { id: 'wrench', style: 'solid' },
  'hammer':                     { id: 'hammer', style: 'solid' },
  'lucide-hammer':              { id: 'hammer', style: 'solid' },
  'palette':                    { id: 'palette', style: 'solid' },
  'lucide-palette':             { id: 'palette', style: 'solid' },
  'box':                        { id: 'box', style: 'solid' },
  'lucide-box':                 { id: 'box', style: 'solid' },
  'lucide-package':             { id: 'box', style: 'solid' },
  'lucide-package-2':           { id: 'box', style: 'solid' },
  'lucide-packages':            { id: 'box', style: 'solid' },
  'lucide-boxes':               { id: 'box', style: 'solid' },
  'lucide-container':           { id: 'box', style: 'solid' },
  'truck':                      { id: 'truck', style: 'solid' },
  'lucide-truck':               { id: 'truck', style: 'solid' },
  'building':                   { id: 'building', style: 'solid' },
  'lucide-building':            { id: 'building', style: 'solid' },
  'lucide-factory':             { id: 'building', style: 'solid' },
  'lucide-warehouse':           { id: 'building', style: 'solid' },

  // ─── Charts & analytics ───────────────────────────────
  'chart-bar':                  { id: 'chart-column', style: 'solid' },
  'chart-column':               { id: 'chart-column', style: 'solid' },
  'lucide-bar-chart-3':         { id: 'chart-column', style: 'solid' },
  'compass':                    { id: 'compass', style: 'solid' },
  'lucide-compass':             { id: 'compass', style: 'solid' },
  'lucide-radar':               { id: 'compass', style: 'solid' },
  'map':                        { id: 'map', style: 'solid' },
  'lucide-map':                 { id: 'map', style: 'solid' },
  'map-marker':                 { id: 'location-dot', style: 'solid' },
  'location-dot':               { id: 'location-dot', style: 'solid' },
  'lucide-map-pin':             { id: 'location-dot', style: 'solid' },

  // ─── Decorative / misc ────────────────────────────────
  'sparkles':                   { id: 'wand-magic-sparkles', style: 'solid' },
  'lucide-sparkles':            { id: 'wand-magic-sparkles', style: 'solid' },
  'sun':                        { id: 'sun', style: 'solid' },
  'lucide-sun':                 { id: 'sun', style: 'solid' },
  'moon':                       { id: 'moon', style: 'solid' },
  'lucide-moon':                { id: 'moon', style: 'solid' },
  'heart':                      { id: 'heart', style: 'solid' },
  'heart-fill':                 { id: 'heart', style: 'solid' },
  'lucide-heart':               { id: 'heart', style: 'solid' },
  'material-symbols-heart-smile':{ id: 'heart', style: 'solid' },
  'star':                       { id: 'star', style: 'solid' },
  'lucide-star':                { id: 'star', style: 'solid' },
  'lucide-gem':                 { id: 'star', style: 'solid' },
  'graduation-cap':             { id: 'graduation-cap', style: 'solid' },
  'lucide-graduation-cap':      { id: 'graduation-cap', style: 'solid' },
  'bolt':                       { id: 'bolt', style: 'solid' },
  'lucide-bolt':                { id: 'bolt', style: 'solid' },
  'lucide-zap':                 { id: 'bolt', style: 'solid' },
  'trophy':                     { id: 'trophy', style: 'solid' },
  'lucide-award':               { id: 'trophy', style: 'solid' },
  'briefcase':                  { id: 'briefcase', style: 'solid' },
  'lucide-briefcase':           { id: 'briefcase', style: 'solid' },
  'book':                       { id: 'book', style: 'solid' },
  'lucide-book-open':           { id: 'book', style: 'solid' },
  'credit-card':                { id: 'credit-card', style: 'solid' },
  'lucide-credit-card':         { id: 'credit-card', style: 'solid' },
  'lightbulb':                  { id: 'lightbulb', style: 'solid' },
  'lucide-lightbulb':           { id: 'lightbulb', style: 'solid' },
  'bullseye':                   { id: 'bullseye', style: 'solid' },
  'lucide-target':              { id: 'bullseye', style: 'solid' },
  'lucide-goal':                { id: 'bullseye', style: 'solid' },
  'lucide-crosshair':           { id: 'bullseye', style: 'solid' },
  'flag':                       { id: 'flag', style: 'solid' },
  'lucide-flag':                { id: 'flag', style: 'solid' },
  'wave-pulse':                 { id: 'wave-square', style: 'solid' },
  'lucide-activity':            { id: 'wave-square', style: 'solid' },
};

/**
 * Résout un token (Lucide-style, court, ou autre) vers un IconRef Font Awesome.
 * Fallback : ICON_MAP[token] → ICON_MAP[strip prefix] → FALLBACK question.
 */
export function toFontAwesome(token: string | null | undefined): IconRef {
  if (!token) return FALLBACK;
  const direct = ICON_MAP[token];
  if (direct) return direct;
  const bare = token.replace(/^(lucide-|bi-|pi-|material-symbols-)/, '');
  const stripped = ICON_MAP[bare];
  if (stripped) return stripped;
  return FALLBACK;
}

/** Liste dé-dupliquée pour le script de génération du sprite. */
export function uniqueIcons(): readonly IconRef[] {
  const seen = new Set<string>();
  const result: IconRef[] = [];
  for (const ref of Object.values(ICON_MAP)) {
    const key = `${ref.style}/${ref.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ref);
    }
  }
  // S'assurer que le fallback est inclus
  const fbKey = `${FALLBACK.style}/${FALLBACK.id}`;
  if (!seen.has(fbKey)) result.push(FALLBACK);
  return result;
}
