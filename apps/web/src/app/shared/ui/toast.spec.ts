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

  // Le titre nomme déjà la sévérité : sa couleur reste portée par l'icône et la barre.
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
    'Given severity="%s" When the toast renders Then the container is an opaque surface with a "%s" bar, without blur',
    (severity, token) => {
      const classes = byTestId(renderToast(severity), 'toast').className.split(/\s+/);

      expect({
        backgrounds: classes.filter((c) => c.startsWith('bg-')),
        blurs: classes.filter((c) => c.includes('blur')),
        bar: classes.includes('border-l-4'),
        barColours: classes.filter((c) => c.startsWith(`border-${token}`)).length,
      }).toEqual({ backgrounds: ['bg-surface'], blurs: [], bar: true, barColours: 1 });
    },
  );

  it.each(Object.keys(TOKEN_BY_SEVERITY) as ToastSeverity[])(
    'Given severity="%s" When the close button is hovered Then it gets the neutral foreground wash only',
    (severity) => {
      const classes = byTestId(renderToast(severity), 'toast-close').className.split(/\s+/);

      expect(classes.filter((c) => c.startsWith('hover:bg-'))).toEqual(['hover:bg-foreground/5']);
    },
  );
});
