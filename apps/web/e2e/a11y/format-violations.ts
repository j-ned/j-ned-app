import type AxeBuilder from '@axe-core/playwright';

export type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

type AuditContext = { readonly page: string; readonly theme: string; readonly state: string };

export function formatViolations(
  violations: AxeResults['violations'],
  { page, theme, state }: AuditContext,
): string {
  const header = `${page} · ${theme} · ${state} : ${violations.length} violation(s) WCAG`;
  const lines = violations.flatMap((violation) =>
    violation.nodes.map(
      (node) =>
        `[${violation.impact ?? 'n/a'}] ${violation.id} — ${violation.help} — ${node.target.join(' ')} — ${violation.helpUrl}`,
    ),
  );
  return [header, ...lines].join('\n');
}
