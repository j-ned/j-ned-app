import { TestBed } from '@angular/core/testing';
import { Button } from './button';

async function renderButton(size?: string): Promise<HTMLButtonElement> {
  const fixture = TestBed.createComponent(Button);
  if (size !== undefined) fixture.componentRef.setInput('size', size);
  fixture.detectChanges();
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
}

const sorted = (button: HTMLButtonElement): string[] => [...button.classList].sort();

describe('Button', () => {
  it('Given size icon When rendered Then the inner button is a 44 px square without text padding', async () => {
    const button = await renderButton('icon');

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(sorted(button)).toEqual(expect.arrayContaining(['min-h-11', 'min-w-11']));
    expect(sorted(button).filter((token) => /^(\w+:)?(px|pl|pr)-/.test(token))).toEqual([]);
  });

  it('Given no size When rendered Then the inner button keeps the default text sizing', async () => {
    const button = await renderButton();

    expect(sorted(button)).toEqual(
      [
        'text-sm',
        'px-5',
        'py-2.5',
        'min-h-11',
        'rounded-md',
        'bg-primary-bg',
        'text-white',
        'border',
        'border-primary-bg',
        'shadow-sm',
        'hover:opacity-90',
      ].sort(),
    );
  });
});
