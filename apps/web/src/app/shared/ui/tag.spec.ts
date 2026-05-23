import { TestBed } from '@angular/core/testing';
import { AppTag } from './tag';

describe('AppTag', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppTag] });
  });

  function renderTag(props: {
    value: string | number;
    severity?: 'info' | 'success' | 'warn' | 'error' | 'secondary';
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
    expect(span.className).toContain('bg-primary/10');
    expect(span.className).toContain('text-primary');
  });

  const cases: ['info' | 'success' | 'warn' | 'error' | 'secondary', string][] = [
    ['info', 'bg-primary/10'],
    ['success', 'bg-status-success/15'],
    ['warn', 'bg-status-warn/15'],
    ['error', 'bg-status-error/15'],
    ['secondary', 'bg-foreground/8'],
  ];

  for (const [severity, expectedClass] of cases) {
    it(`applies the correct Tailwind class for severity="${severity}"`, () => {
      const span = renderTag({ value: 'X', severity });
      expect(span.className).toContain(expectedClass);
    });
  }
});
