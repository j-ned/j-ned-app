import { TestBed } from '@angular/core/testing';
import { AppTag } from './tag';

describe('AppTag', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppTag] });
  });

  function renderTag(props: { value: string | number; severity?: 'info' | 'success' | 'warn' | 'error' | 'secondary' }) {
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
    expect(span.className).toContain('bg-blue-100');
    expect(span.className).toContain('text-blue-700');
  });

  const cases: Array<['info' | 'success' | 'warn' | 'error' | 'secondary', string]> = [
    ['info', 'bg-blue-100'],
    ['success', 'bg-green-100'],
    ['warn', 'bg-amber-100'],
    ['error', 'bg-red-100'],
    ['secondary', 'bg-slate-100'],
  ];

  for (const [severity, expectedClass] of cases) {
    it(`applies the correct Tailwind class for severity="${severity}"`, () => {
      const span = renderTag({ value: 'X', severity });
      expect(span.className).toContain(expectedClass);
    });
  }
});
