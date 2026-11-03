import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPageHeader, type AdminPageParent } from './admin-page-header';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';

@Component({
  imports: [AdminPageHeader],
  template: `
    <app-admin-page-header [overline]="overline()" [heading]="heading()">
      <p data-testid="projected-intro">Ce que montrent Réalisations et l'accueil.</p>
      <a adminPageAside data-testid="projected-action" href="/admin/projects/new">Nouveau projet</a>
    </app-admin-page-header>
  `,
})
class HeaderHost {
  readonly overline = signal('6 réalisations · 2 mises en avant');
  readonly heading = signal('Projets');
}

@Component({
  imports: [AdminPageHeader],
  template: `<app-admin-page-header [heading]="heading()" [parent]="parent" />`,
})
class ParentHeaderHost {
  readonly heading = signal('DashFlow');
  readonly parent: AdminPageParent = { label: 'Projets', route: '/admin/projects' };
}

async function render<T>(component: new () => T): Promise<{
  fixture: ComponentFixture<T>;
  host: HTMLElement;
}> {
  const fixture = TestBed.createComponent(component);
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const follows = (earlier: Element | null, later: Element | null): boolean =>
  earlier !== null &&
  later !== null &&
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe('AdminPageHeader', () => {
  it('Given an overline and a heading When the header renders Then the overline sits above a focusable-by-script h1', async () => {
    const { host } = await render(HeaderHost);
    const overline = byTestId(host, 'admin-page-overline');
    const title = byTestId(host, 'admin-page-title');

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      titleTag: title?.tagName,
      titleTabindex: title?.getAttribute('tabindex'),
      headings: host.querySelectorAll('h1').length,
      inOneHeader:
        overline?.closest('header') !== null &&
        overline?.closest('header') === title?.closest('header'),
      overlineFirst: follows(overline, title),
    }).toEqual({
      overline: '6 réalisations · 2 mises en avant',
      title: 'Projets',
      titleTag: 'H1',
      titleTabindex: '-1',
      headings: 1,
      inOneHeader: true,
      overlineFirst: true,
    });
  });

  describe('with a parent page', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
    });

    it('Given a parent When the header renders Then a breadcrumb leads to the parent and marks the heading as the current page, in place of the overline', async () => {
      const { host } = await render(ParentHeaderHost);
      const breadcrumb = byTestId(host, 'admin-breadcrumb');
      const parent = byTestId(host, 'admin-breadcrumb-parent');
      const current = byTestId(host, 'admin-breadcrumb-current');
      const title = byTestId(host, 'admin-page-title');

      expect({
        breadcrumb: {
          tag: breadcrumb?.tagName,
          label: breadcrumb?.getAttribute('aria-label'),
          inTitleHeader:
            breadcrumb?.closest('header') !== null &&
            breadcrumb?.closest('header') === title?.closest('header'),
          beforeTitle: follows(breadcrumb, title),
        },
        parent: {
          tag: parent?.tagName,
          text: testIdText(host, 'admin-breadcrumb-parent'),
          href: parent?.getAttribute('href'),
        },
        current: {
          text: testIdText(host, 'admin-breadcrumb-current'),
          ariaCurrent: current?.getAttribute('aria-current'),
        },
        overline: byTestId(host, 'admin-page-overline'),
        headings: host.querySelectorAll('h1').length,
        titleTabindex: title?.getAttribute('tabindex'),
      }).toEqual({
        breadcrumb: { tag: 'NAV', label: "Fil d'Ariane", inTitleHeader: true, beforeTitle: true },
        parent: { tag: 'A', text: 'Projets', href: '/admin/projects' },
        current: { text: 'DashFlow', ariaCurrent: 'page' },
        overline: null,
        headings: 1,
        titleTabindex: '-1',
      });
    });

    it('Given a breadcrumb When the heading changes Then the current page follows it', async () => {
      const { fixture, host } = await render(ParentHeaderHost);

      fixture.componentInstance.heading.set('DashFlow 2');
      await settle(fixture);

      expect({
        current: testIdText(host, 'admin-breadcrumb-current'),
        title: testIdText(host, 'admin-page-title'),
      }).toEqual({ current: 'DashFlow 2', title: 'DashFlow 2' });
    });
  });
});
