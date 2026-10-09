import { Component, input, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { Button, type ButtonVariant } from './button';

const BASE = [
  'inline-flex',
  'min-h-11',
  'items-center',
  'gap-2',
  'text-[0.9375rem]',
  'font-semibold',
  'transition-colors',
  'cursor-pointer',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
];

const PRIMARY = ['bg-primary-bg', 'text-white', 'hover:bg-primary-bg/90'];

const OUTLINED = [
  'border',
  'border-foreground/15',
  'text-foreground',
  'hover:border-primary/40',
  'hover:text-primary',
];

const GHOST_ICON = [
  'inline-flex',
  'size-11',
  'items-center',
  'justify-center',
  'rounded-md',
  'text-foreground',
  'transition-colors',
  'hover:bg-surface-elevated',
];

@Component({
  imports: [Button],
  template: `<button appButton type="button" data-testid="b">Envoyer</button>`,
})
class UnboundHost {}

@Component({
  imports: [Button],
  template: `<button appButton type="button" data-testid="b" [variant]="variant()">
    Envoyer
  </button>`,
})
class VariantHost {
  readonly variant = input.required<ButtonVariant>();
}

@Component({
  imports: [Button],
  template: `<button appButton type="button" data-testid="b" size="icon">+</button>`,
})
class IconHost {}

@Component({
  imports: [Button],
  template: `<button appButton type="button" data-testid="b" [rounded]="true">Envoyer</button>`,
})
class RoundedHost {}

@Component({
  imports: [Button],
  template: `<button appButton type="button" data-testid="b" [block]="true">Envoyer</button>`,
})
class BlockHost {}

@Component({
  imports: [Button],
  template: `<button appButton type="submit" data-testid="b" class="mt-5">Envoyer</button>`,
})
class SubmitHost {}

@Component({
  imports: [Button, RouterLink],
  template: `<a appButton routerLink="/projects" data-testid="b">Projets</a>`,
})
class LinkHost {}

@Component({
  imports: [Button],
  template: `<a appButton variant="ghost-icon" href="/admin" data-testid="b">x</a>`,
})
class GhostIconHost {}

@Component({
  imports: [Button],
  template: `<a
    appButton
    variant="ghost-icon"
    size="icon"
    [rounded]="true"
    href="/admin"
    data-testid="b"
    >x</a
  >`,
})
class ShapedGhostIconHost {}

@Component({
  imports: [Button],
  template: `<a appButton variant="outlined" href="/about" data-testid="b">En savoir plus</a>`,
})
class OutlinedLinkHost {}

@Component({
  imports: [Button],
  template: `<button
    appButton
    variant="outlined"
    type="button"
    aria-pressed="true"
    class="aria-pressed:border-primary"
    data-testid="b"
  >
    Exclure
  </button>`,
})
class PressedHost {}

async function render<T>(
  host: Type<T>,
  inputs: Readonly<Record<string, unknown>> = {},
): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(host);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).querySelector('[data-testid="b"]') as HTMLElement;
}

const sorted = (element: HTMLElement): string[] => [...element.classList].sort();

describe('Button', () => {
  it('Given no binding When rendered Then the native button carries the primary call template', async () => {
    const button = await render(UnboundHost);

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(sorted(button)).toEqual([...BASE, 'rounded-md', 'px-5', ...PRIMARY].sort());
  });

  it.each<[ButtonVariant, readonly string[]]>([
    ['primary', PRIMARY],
    ['outlined', OUTLINED],
    ['danger', ['bg-status-error', 'text-on-status-error', 'hover:bg-status-error/90']],
    [
      'outlined-danger',
      [
        'border',
        'border-status-error/40',
        'text-status-error',
        'hover:border-status-error/60',
        'hover:bg-status-error/10',
      ],
    ],
    ['text', ['text-primary', 'hover:bg-primary/10']],
    ['text-muted', ['text-muted', 'hover:bg-foreground/5', 'hover:text-foreground']],
    ['text-danger', ['text-status-error', 'hover:bg-status-error/10']],
  ])(
    'Given the %s variant When rendered Then the call template carries its colours',
    async (variant, colours) => {
      const button = await render(VariantHost, { variant });

      expect(sorted(button)).toEqual([...BASE, 'rounded-md', 'px-5', ...colours].sort());
    },
  );

  it('Given size icon When rendered Then the button is a centred 44 px square without text padding', async () => {
    const button = await render(IconHost);

    expect(sorted(button)).toEqual(
      [...BASE, 'rounded-md', 'min-w-11', 'justify-center', ...PRIMARY].sort(),
    );
    expect(sorted(button).filter((token) => /^(\w+:)?(px|pl|pr)-/.test(token))).toEqual([]);
  });

  it('Given rounded When rendered Then the button is fully rounded', async () => {
    const button = await render(RoundedHost);

    expect(sorted(button)).toEqual([...BASE, 'rounded-full', 'px-5', ...PRIMARY].sort());
  });

  it('Given block When rendered Then the button spans the full width with a centred label', async () => {
    const button = await render(BlockHost);

    expect(sorted(button)).toEqual(
      [...BASE, 'rounded-md', 'px-5', 'w-full', 'justify-center', ...PRIMARY].sort(),
    );
  });

  it('Given a submit button with a consumer class When rendered Then both survive next to the template', async () => {
    const button = await render(SubmitHost);

    expect(button.getAttribute('type')).toBe('submit');
    expect(sorted(button)).toEqual([...BASE, 'rounded-md', 'px-5', ...PRIMARY, 'mt-5'].sort());
  });

  it('Given a router link When rendered Then the anchor keeps its href and carries the call template', async () => {
    const link = await render(LinkHost);

    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link.getAttribute('href')).toBe('/projects');
    expect(sorted(link)).toEqual([...BASE, 'rounded-md', 'px-5', ...PRIMARY].sort());
  });

  it.each<[string, Type<unknown>]>([
    ['alone', GhostIconHost],
    ['with size icon and rounded', ShapedGhostIconHost],
  ])(
    'Given a ghost-icon link %s When rendered Then it carries its own chain and nothing of the call template',
    async (_label, host) => {
      const link = await render(host);

      expect(link).toBeInstanceOf(HTMLAnchorElement);
      expect(sorted(link)).toEqual([...GHOST_ICON].sort());
    },
  );

  it('Given an outlined link When rendered Then the anchor carries the same template as an outlined button', async () => {
    const link = await render(OutlinedLinkHost);

    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(sorted(link)).toEqual([...BASE, 'rounded-md', 'px-5', ...OUTLINED].sort());
  });

  it('Given a pressed toggle with its own state class When rendered Then aria-pressed and the class survive next to the template', async () => {
    const button = await render(PressedHost);

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(sorted(button)).toEqual(
      [...BASE, 'rounded-md', 'px-5', ...OUTLINED, 'aria-pressed:border-primary'].sort(),
    );
  });
});
