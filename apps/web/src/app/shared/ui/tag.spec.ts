import { TestBed } from '@angular/core/testing';
import { AppTag, type AppTagSeverity } from './tag';

const SEVERITY_LOOK: Record<AppTagSeverity, readonly string[]> = {
  info: ['bg-primary/10', 'text-primary'],
  secondary: ['bg-foreground/8', 'text-muted'],
};

describe('AppTag', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppTag] });
  });

  function renderTag(props: {
    value: string | number;
    severity?: AppTagSeverity;
  }): HTMLSpanElement {
    const fixture = TestBed.createComponent(AppTag);
    fixture.componentRef.setInput('value', props.value);
    if (props.severity) fixture.componentRef.setInput('severity', props.severity);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('span') as HTMLSpanElement;
  }

  it('renders the value inside the span', () => {
    const span = renderTag({ value: 'Featured' });
    expect(span.textContent?.trim()).toBe('Featured');
  });

  it('renders a numeric value', () => {
    const span = renderTag({ value: 42 });
    expect(span.textContent?.trim()).toBe('42');
  });

  it('defaults to info severity classes when severity is omitted', () => {
    const span = renderTag({ value: 'X' });
    expect(SEVERITY_LOOK.info.filter((token) => span.classList.contains(token))).toEqual(
      SEVERITY_LOOK.info,
    );
  });

  it.each(Object.entries(SEVERITY_LOOK) as [AppTagSeverity, readonly string[]][])(
    'Given severity="%s" When the tag renders Then it carries the matching theme classes',
    (severity, look) => {
      const span = renderTag({ value: 'X', severity });
      expect(look.filter((token) => span.classList.contains(token))).toEqual(look);
    },
  );

  // One Indigo Rule (DESIGN.md) : les tags passent par les tokens du thème, jamais par la
  // palette Tailwind par défaut (blue, slate…) qui ignore les registres Console / Ivoire.
  it.each(Object.keys(SEVERITY_LOOK) as AppTagSeverity[])(
    'Given severity="%s" When the tag renders Then no default Tailwind palette color is used',
    (severity) => {
      const span = renderTag({ value: 'X', severity });
      expect(span.className).not.toMatch(
        /\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|blue|sky|indigo|violet|green|amber|red)-\d{2,3}\b/,
      );
    },
  );
});
