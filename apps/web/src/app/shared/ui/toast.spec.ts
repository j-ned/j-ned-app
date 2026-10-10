import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import type { ToastSeverity } from './toast.types';

const TOKEN_BY_SEVERITY: Record<ToastSeverity, string> = {
  success: 'status-success',
  info: 'primary',
  warn: 'status-warn',
  error: 'status-error',
};

describe('Toast', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Toast] });
  });

  function renderToast(severity: ToastSeverity): HTMLElement {
    const fixture = TestBed.createComponent(Toast);
    fixture.componentRef.setInput('messages', [
      { id: 1, severity, summary: 'Résumé', detail: 'Détail', life: 3000 },
    ]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId(root: HTMLElement, id: string): Element {
    const el = root.querySelector(`[data-testid="${id}"]`);
    if (!el) throw new Error(`data-testid="${id}" not found`);
    return el;
  }

  // WCAG 1.4.3 : en thème Ivoire, `status-success` et `status-warn` pleins tombent sous 4,5:1 sur
  // la teinte à 10 % du conteneur (axe : 2,94 et 2,99). Le titre, qui nomme déjà la sévérité,
  // est écrit en `foreground` ; la couleur de sévérité reste portée par l'icône et la bordure.
  it.each(Object.keys(TOKEN_BY_SEVERITY) as ToastSeverity[])(
    'Given severity="%s" When the toast renders Then the summary uses the foreground token',
    (severity) => {
      const root = renderToast(severity);

      const classes = byTestId(root, 'toast-summary').className.split(/\s+/);
      expect(classes).toContain('text-foreground');
      expect(classes.filter((c) => c.startsWith('text-status-') || c === 'text-primary')).toEqual(
        [],
      );
    },
  );

  // WCAG 1.4.11 : une opacité (`text-x/70`) mélange la couleur au fond et fait chuter le ratio :
  // l'icône et le bouton fermer gardent le token plein.
  it.each(Object.entries(TOKEN_BY_SEVERITY) as [ToastSeverity, string][])(
    'Given severity="%s" When the toast renders Then icon and close use the full-opacity "%s" token',
    (severity, token) => {
      const root = renderToast(severity);

      for (const id of ['toast-icon', 'toast-close']) {
        const classes = byTestId(root, id).className.split(/\s+/);
        expect(classes).toContain(`text-${token}`);
        expect(classes.filter((c) => c.startsWith('text-') && c.includes('/'))).toEqual([]);
      }
    },
  );

  it.each(Object.entries(TOKEN_BY_SEVERITY) as [ToastSeverity, string][])(
    'Given severity="%s" When the toast renders Then the container is tinted with "%s" at 10%%',
    (severity, token) => {
      const root = renderToast(severity);

      expect(byTestId(root, 'toast').className.split(/\s+/)).toContain(`bg-${token}/10`);
    },
  );
});
