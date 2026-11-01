import { TestBed } from '@angular/core/testing';
import { AppIcon } from './app-icon';
import { SPRITE_VERSION } from './sprite-version';

const SPRITE = `/icons/sprite.svg?v=${SPRITE_VERSION}`;

describe('AppIcon', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppIcon] });
  });

  function renderIcon(props: { name: string; size?: number; label?: string | null }): SVGElement {
    const fixture = TestBed.createComponent(AppIcon);
    fixture.componentRef.setInput('name', props.name);
    if (props.size !== undefined) fixture.componentRef.setInput('size', props.size);
    if (props.label !== undefined) fixture.componentRef.setInput('label', props.label);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('svg') as SVGElement;
  }

  it('renders an svg with a use element pointing to the sprite', () => {
    const svg = renderIcon({ name: 'envelope' });
    expect(svg).toBeTruthy();
    const use = svg.querySelector('use');
    expect(use?.getAttribute('href')).toBe(`${SPRITE}#solid-envelope`);
  });

  it('Given the sprite fingerprint When an icon renders Then its URL carries the content hash so a new sprite gets a new URL', () => {
    const use = renderIcon({ name: 'envelope' }).querySelector('use');

    expect({
      fingerprint: /^[0-9a-f]{8}$/.test(SPRITE_VERSION),
      href: use?.getAttribute('href'),
    }).toEqual({ fingerprint: true, href: `/icons/sprite.svg?v=${SPRITE_VERSION}#solid-envelope` });
  });

  it('defaults size to 20', () => {
    const svg = renderIcon({ name: 'envelope' });
    expect(svg.getAttribute('width')).toBe('20');
    expect(svg.getAttribute('height')).toBe('20');
  });

  it('uses the size input', () => {
    const svg = renderIcon({ name: 'envelope', size: 32 });
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('is aria-hidden by default (decorative)', () => {
    const svg = renderIcon({ name: 'envelope' });
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.getAttribute('aria-label')).toBeNull();
  });

  it('exposes role=img + aria-label when label is provided', () => {
    const svg = renderIcon({ name: 'lock', label: 'Verrouillé' });
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Verrouillé');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('resolves Lucide-prefixed tokens', () => {
    const svg = renderIcon({ name: 'lucide-mail' });
    const use = svg.querySelector('use');
    expect(use?.getAttribute('href')).toBe(`${SPRITE}#solid-envelope`);
  });

  it('resolves brands icons', () => {
    const svg = renderIcon({ name: 'lucide-github' });
    const use = svg.querySelector('use');
    expect(use?.getAttribute('href')).toBe(`${SPRITE}#brands-github`);
  });

  it('falls back to question icon for unknown tokens', () => {
    const svg = renderIcon({ name: 'totally-unknown-xyz' });
    const use = svg.querySelector('use');
    expect(use?.getAttribute('href')).toBe(`${SPRITE}#solid-question`);
  });
});
