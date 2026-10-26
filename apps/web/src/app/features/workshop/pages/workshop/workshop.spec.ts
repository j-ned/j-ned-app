import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WORKSHOP_SPACE } from '../../domain/workshop-space.static-data';
import { Workshop } from './workshop';

const collapsed = (element: Element | null): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

const renderWorkshop = async (): Promise<HTMLElement> => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Workshop);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('Workshop', () => {
  it('Given the workshop space When the page is rendered Then its single h1 is the space heading', async () => {
    const host = await renderWorkshop();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(collapsed(host.querySelector('[data-testid="workshop-title"]'))).toBe(
      WORKSHOP_SPACE.heading,
    );
    expect(host.querySelector('h1')?.getAttribute('data-testid')).toBe('workshop-title');
  });

  it('Given the workshop space When the page is rendered Then the intro shows each paragraph of the space, in order', async () => {
    const host = await renderWorkshop();

    expect(
      [...host.querySelectorAll('[data-testid="workshop-intro"]')].map((paragraph) => [
        paragraph.tagName,
        collapsed(paragraph),
      ]),
    ).toEqual(WORKSHOP_SPACE.intro.map((paragraph) => ['P', paragraph]));
  });

  it('Given the shell owns the landmarks When the page is rendered Then it emits no main, header nor footer and lays itself out on the host', async () => {
    const host = await renderWorkshop();

    expect(host.querySelectorAll('main, header, footer')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });

  it('Given the workshop tools When the page is rendered Then a section is named by its h2, the tools heading', async () => {
    const host = await renderWorkshop();
    const section = host.querySelector('[data-testid="workshop-tools"]');
    const labelId = section?.getAttribute('aria-labelledby') ?? '';
    const label = labelId === '' ? null : host.querySelector(`[id="${labelId}"]`);

    expect([section?.tagName, label?.tagName, collapsed(label)]).toEqual([
      'SECTION',
      'H2',
      WORKSHOP_SPACE.toolsHeading,
    ]);
  });

  it('Given the workshop tools When the page is rendered Then each tool is a card link to its path, with its overline, title and summary', async () => {
    const host = await renderWorkshop();

    expect(
      [...host.querySelectorAll('[data-testid="workshop-tool-card"]')].map((card) => [
        card.tagName,
        card.getAttribute('href'),
        [...card.children].map(collapsed),
      ]),
    ).toEqual(
      WORKSHOP_SPACE.tools.map((tool) => [
        'A',
        tool.path,
        [tool.overline, tool.title, tool.summary],
      ]),
    );
  });
});
