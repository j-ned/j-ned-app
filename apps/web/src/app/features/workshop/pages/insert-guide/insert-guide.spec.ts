import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { settle } from '@shared/testing/settle';
import { INSERT_GUIDE_COPY } from '../../application/insert-guide-copy';
import { INSERT_GUIDE_REFERENCE } from '../../application/insert-guide-reference';
import type { InsertGuideReference } from '../../domain/models/insert-guide-reference.model';
import type { Material } from '../../domain/models/material.model';
import type { ExternalSituation } from '../../domain/models/recommendation.model';
import { OPERATION_FAMILIES } from '../../domain/operations.static-data';
import {
  aCitation,
  aMaterialCatalogue,
  anIsoInsert,
  anIsoInsertField,
  anIsoInsertProposal,
  aRecommendation,
  aReference,
  aSourced,
} from '../../testing/insert-guide-builders';
import { InsertGuidePage } from '../../testing/insert-guide.page-model';
import { InsertGuide } from './insert-guide';

const collapsed = (element: Element | null): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

const renderInsertGuide = async (): Promise<HTMLElement> => {
  const fixture = TestBed.createComponent(InsertGuide);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('InsertGuide', () => {
  it('Given the guide copy When the page is rendered Then its single h1 is the guide heading', async () => {
    const host = await renderInsertGuide();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('h1')?.getAttribute('data-testid')).toBe('insert-guide-title');
    expect(collapsed(host.querySelector('[data-testid="insert-guide-title"]'))).toBe(
      INSERT_GUIDE_COPY.heading,
    );
  });

  it('Given the guide copy When the page is rendered Then the lead paragraph introduces the guide', async () => {
    const lead = (await renderInsertGuide()).querySelector('[data-testid="insert-guide-lead"]');

    expect([lead?.tagName, collapsed(lead)]).toEqual(['P', INSERT_GUIDE_COPY.lead]);
  });

  it('Given the guide copy When the page is rendered Then the disclaimer is always shown', async () => {
    const disclaimer = (await renderInsertGuide()).querySelector(
      '[data-testid="insert-guide-disclaimer"]',
    );

    expect([disclaimer?.tagName, collapsed(disclaimer)]).toEqual([
      'P',
      INSERT_GUIDE_COPY.disclaimer,
    ]);
  });

  it('Given nothing is chosen yet When the page is rendered Then the live status region exists and is empty', async () => {
    const status = (await renderInsertGuide()).querySelector('[data-testid="insert-guide-status"]');

    expect([status?.getAttribute('role'), collapsed(status)]).toEqual(['status', '']);
  });

  it('Given the shell owns the landmarks When the page is rendered Then it emits no main, header nor footer and lays itself out on the host', async () => {
    const host = await renderInsertGuide();

    expect(host.querySelectorAll('main, header, footer')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pt-20']);
  });
});

const [ALPHA, BETA, GAMMA] = aMaterialCatalogue();
const GUIDE_PATH = '/atelier/plaquettes';
const nameOf = (material: Material): string => material.designations[0].value;

type OpenedGuide = {
  readonly page: InsertGuidePage;
  readonly router: Router;
  readonly navigations: () => number;
};

async function openGuide(
  url: string,
  reference: InsertGuideReference = aReference({
    materials: [ALPHA, BETA, GAMMA],
    families: OPERATION_FAMILIES,
  }),
): Promise<OpenedGuide> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [{ path: 'atelier/plaquettes', component: InsertGuide }],
        withComponentInputBinding(),
      ),
      provideLocationMocks(),
      { provide: INSERT_GUIDE_REFERENCE, useValue: reference },
    ],
  });
  const router = TestBed.inject(Router);
  // Sans navigation initiale, rien n'écoute le popstate : le retour arrière doit être branché.
  router.setUpLocationChangeListener();
  let started = 0;
  router.events.subscribe((event) => {
    if (event instanceof NavigationStart) started++;
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  await settle(harness.fixture);
  return { page: new InsertGuidePage(harness.fixture), router, navigations: () => started };
}

describe('InsertGuide: choosing the material', () => {
  it('Given the guide When it renders Then a section named by its h2 holds the material field', async () => {
    const { page } = await openGuide(GUIDE_PATH);
    const section = page.one('insert-guide-material');
    const heading = section?.querySelector(`[id="${section.getAttribute('aria-labelledby')}"]`);

    expect({
      tag: section?.tagName,
      heading: heading?.tagName,
      headingText: heading?.textContent?.trim(),
      field: section?.contains(page.materialInput),
      h1: page.host.querySelectorAll('h1').length,
    }).toEqual({
      tag: 'SECTION',
      heading: 'H2',
      headingText: INSERT_GUIDE_COPY.materialHeading,
      field: true,
      h1: 1,
    });
  });

  it('Given a known material in the URL When the guide renders Then the field shows it and its sheet is displayed', async () => {
    const { page } = await openGuide(`${GUIDE_PATH}?matiere=${BETA.slug}`);

    expect([page.materialInput.value, page.sheetName()]).toEqual([nameOf(BETA), nameOf(BETA)]);
  });

  it('Given a known material in the URL When the guide renders Then it does not navigate', async () => {
    const { router, navigations } = await openGuide(`${GUIDE_PATH}?matiere=${BETA.slug}`);

    expect([navigations(), router.url]).toEqual([1, `${GUIDE_PATH}?matiere=${BETA.slug}`]);
  });

  it('Given an unknown material in the URL When the guide renders Then nothing is chosen, the slug is shown nowhere and the URL is left as is', async () => {
    const { page, router, navigations } = await openGuide(
      `${GUIDE_PATH}?matiere=matiere-inconnue-zz`,
    );

    expect({
      text: page.materialInput.value,
      sheet: page.one('material-sheet'),
      echoed: page.host.textContent?.includes('matiere-inconnue-zz'),
      url: router.url,
      navigations: navigations(),
    }).toEqual({
      text: '',
      sheet: null,
      echoed: false,
      url: `${GUIDE_PATH}?matiere=matiere-inconnue-zz`,
      navigations: 1,
    });
  });

  it('Given no material in the URL When one is chosen at the keyboard Then the URL keeps it, replacing the history entry, and its sheet is displayed', async () => {
    const { page, router } = await openGuide(GUIDE_PATH);

    await page.typeMaterial('gamma');
    await page.press('ArrowDown');
    await page.press('Enter');

    expect({
      url: router.url,
      replaceUrl: router.lastSuccessfulNavigation()?.extras.replaceUrl,
      sheet: page.sheetName(),
    }).toEqual({
      url: `${GUIDE_PATH}?matiere=${GAMMA.slug}`,
      replaceUrl: true,
      sheet: nameOf(GAMMA),
    });
  });

  it('Given another query parameter When a material is chosen Then that parameter is kept', async () => {
    const { page, router } = await openGuide(`${GUIDE_PATH}?operation=gorge`);

    await page.press('ArrowDown');
    await page.press('Enter');

    expect(router.url).toBe(`${GUIDE_PATH}?operation=gorge&matiere=${ALPHA.slug}`);
  });

  it('Given a material chosen after another When the user goes back Then the field and the sheet follow the URL without a new navigation', async () => {
    const { page, router, navigations } = await openGuide(`${GUIDE_PATH}?matiere=${ALPHA.slug}`);
    await router.navigateByUrl(`${GUIDE_PATH}?matiere=${BETA.slug}`);
    await settle(page.fixture);
    const before = navigations();

    TestBed.inject(Location).back();
    // Le routeur ne rejoue un popstate qu'après une macro-tâche.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await settle(page.fixture);

    expect({
      url: router.url,
      text: page.materialInput.value,
      sheet: page.sheetName(),
      navigations: navigations() - before,
    }).toEqual({
      url: `${GUIDE_PATH}?matiere=${ALPHA.slug}`,
      text: nameOf(ALPHA),
      sheet: nameOf(ALPHA),
      navigations: 1,
    });
  });

  it('Given a reference without material When ArrowDown is pressed in the field Then the field stays usable and announces that no material is found', async () => {
    const { page, router } = await openGuide(
      GUIDE_PATH,
      aReference({ materials: [], families: OPERATION_FAMILIES }),
    );

    await page.press('ArrowDown');
    await page.press('Enter');

    expect({
      status: page.materialStatus(),
      expanded: page.expanded(),
      sheet: page.one('material-sheet'),
      url: router.url,
    }).toEqual({
      status: INSERT_GUIDE_COPY.noMaterialFound,
      expanded: 'false',
      sheet: null,
      url: GUIDE_PATH,
    });
  });
});

const unavailableStatus = (material: Material, operationLabel: string): string =>
  `${nameOf(material)}, ${operationLabel}. ${INSERT_GUIDE_COPY.unavailable}`;

describe('InsertGuide: choosing the operation', () => {
  it('Given the guide When it renders Then the operation and the insert each have a section named by its h2, after the material', async () => {
    const { page } = await openGuide(GUIDE_PATH);
    const named = (testId: string): (string | undefined)[] => {
      const section = page.one(testId);
      const heading = section?.querySelector(`[id="${section.getAttribute('aria-labelledby')}"]`);
      return [section?.tagName, heading?.tagName, heading?.textContent?.trim()];
    };

    expect({
      operation: named('insert-guide-operation'),
      recommendation: named('insert-guide-recommendation'),
      picker: page.one('insert-guide-operation')?.contains(page.one('operation-picker')),
      panel: page
        .one('insert-guide-recommendation')
        ?.contains(page.one('recommendation-incomplete')),
      headings: [...page.host.querySelectorAll('h2')].map((h2) => h2.textContent?.trim()),
    }).toEqual({
      operation: ['SECTION', 'H2', INSERT_GUIDE_COPY.operationHeading],
      recommendation: ['SECTION', 'H2', INSERT_GUIDE_COPY.recommendationHeading],
      picker: true,
      panel: true,
      headings: [
        INSERT_GUIDE_COPY.materialHeading,
        INSERT_GUIDE_COPY.operationHeading,
        INSERT_GUIDE_COPY.recommendationHeading,
      ],
    });
  });

  it('Given a known operation in the URL When the guide renders Then its radio is checked and it does not navigate', async () => {
    const { page, router, navigations } = await openGuide(`${GUIDE_PATH}?operation=gorge`);

    expect([page.checkedOperations(), navigations(), router.url]).toEqual([
      ['gorge'],
      1,
      `${GUIDE_PATH}?operation=gorge`,
    ]);
  });

  it('Given an unknown operation in the URL When the guide renders Then no radio is checked, the slug is shown nowhere and the URL is left as is', async () => {
    const { page, router, navigations } = await openGuide(
      `${GUIDE_PATH}?operation=operation-inconnue-zz`,
    );

    expect({
      radios: page.operationRadios().length,
      checked: page.checkedOperations(),
      echoed: page.host.innerHTML.includes('operation-inconnue-zz'),
      url: router.url,
      navigations: navigations(),
    }).toEqual({
      radios: 9,
      checked: [],
      echoed: false,
      url: `${GUIDE_PATH}?operation=operation-inconnue-zz`,
      navigations: 1,
    });
  });

  it('Given no operation in the URL When one is chosen Then the URL keeps it in one navigation, replacing the history entry', async () => {
    const { page, router, navigations } = await openGuide(GUIDE_PATH);

    await page.chooseOperation('filetage');

    expect({
      url: router.url,
      replaceUrl: router.lastSuccessfulNavigation()?.extras.replaceUrl,
      navigations: navigations(),
    }).toEqual({ url: `${GUIDE_PATH}?operation=filetage`, replaceUrl: true, navigations: 2 });
  });

  it('Given an unknown operation in the URL When a material is chosen Then both keys are written in a single navigation, the unknown one removed', async () => {
    const { page, router, navigations } = await openGuide(
      `${GUIDE_PATH}?operation=operation-inconnue-zz`,
    );

    await page.press('ArrowDown');
    await page.press('Enter');

    expect([router.url, navigations()]).toEqual([`${GUIDE_PATH}?matiere=${ALPHA.slug}`, 2]);
  });

  it('Given a material and an operation without recommendation in the URL When the guide renders Then the panel says so plainly and the status names the case', async () => {
    const { page, navigations } = await openGuide(
      `${GUIDE_PATH}?matiere=${BETA.slug}&operation=gorge`,
    );

    expect({
      unavailable: page.text('insert-guide-unavailable'),
      incomplete: page.one('recommendation-incomplete'),
      status: page.text('insert-guide-status'),
      navigations: navigations(),
    }).toEqual({
      unavailable: INSERT_GUIDE_COPY.unavailable,
      incomplete: null,
      status: unavailableStatus(BETA, 'Gorge'),
      navigations: 1,
    });
  });

  it('Given the guide When the material then two operations are chosen Then the status is silent until the case is complete, then follows each change', async () => {
    const { page } = await openGuide(GUIDE_PATH);
    const statuses: string[] = [page.text('insert-guide-status')];

    await page.press('ArrowDown');
    await page.press('Enter');
    statuses.push(page.text('insert-guide-status'));
    await page.chooseOperation('tronconnage');
    statuses.push(page.text('insert-guide-status'));
    await page.chooseOperation('filetage');
    statuses.push(page.text('insert-guide-status'));

    expect(statuses).toEqual([
      '',
      '',
      unavailableStatus(ALPHA, 'Tronçonnage'),
      unavailableStatus(ALPHA, 'Filetage'),
    ]);
  });

  it.each<[string, (page: InsertGuidePage) => Promise<unknown>]>([
    ['the field loses focus', (page): Promise<unknown> => page.leaveMaterial()],
    ['Escape is pressed', (page): Promise<unknown> => page.press('Escape')],
  ])(
    'Given a chosen material When its text is cleared and %s Then the material is unselected and the URL loses it',
    async (_, leave) => {
      const { page, router } = await openGuide(
        `${GUIDE_PATH}?matiere=${BETA.slug}&operation=gorge`,
      );

      await page.typeMaterial('');
      await leave(page);

      expect({
        url: router.url,
        sheet: page.one('material-sheet'),
        incomplete: page.text('recommendation-incomplete'),
        status: page.text('insert-guide-status'),
      }).toEqual({
        url: `${GUIDE_PATH}?operation=gorge`,
        sheet: null,
        incomplete: INSERT_GUIDE_COPY.incomplete,
        status: '',
      });
    },
  );

  it('Given an operation chosen after another When the user goes back Then the checked radio follows the URL without a new navigation', async () => {
    const { page, router, navigations } = await openGuide(`${GUIDE_PATH}?operation=gorge`);
    await router.navigateByUrl(`${GUIDE_PATH}?operation=filetage`);
    await settle(page.fixture);
    const before = navigations();

    TestBed.inject(Location).back();
    // Le routeur ne rejoue un popstate qu'après une macro-tâche.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await settle(page.fixture);

    expect({
      url: router.url,
      checked: page.checkedOperations(),
      navigations: navigations() - before,
    }).toEqual({ url: `${GUIDE_PATH}?operation=gorge`, checked: ['gorge'], navigations: 1 });
  });
});

describe('InsertGuide: an available recommendation', () => {
  const FINISHING_FOR_ALPHA = aRecommendation('external-finishing', {
    materials: [ALPHA.slug],
    insert: anIsoInsert<ExternalSituation>(
      anIsoInsertProposal({
        situation: 'external-shoulder',
        fields: [
          anIsoInsertField('Forme fictive', 'Z', 'Losange fictif', aCitation({ basis: 'deduced' })),
          anIsoInsertField('Dépouille fictive', 'Q', 'Angle fictif'),
        ],
      }),
      anIsoInsertProposal({
        situation: 'external-profiling',
        fields: [
          anIsoInsertField('Forme fictive', 'Y', 'Losange fictif étroit'),
          anIsoInsertField('Dépouille fictive', 'Q', 'Angle fictif'),
        ],
      }),
    ),
    cuttingSpeed: aSourced({ min: 123, max: 456, unit: 'm/min' }),
  });

  const withRecommendation = aReference({
    materials: [ALPHA, BETA, GAMMA],
    families: OPERATION_FAMILIES,
    recommendations: [FINISHING_FOR_ALPHA],
  });

  const availableStatus = `${nameOf(ALPHA)}, Finition (Tournage extérieur). Plaquettes proposées\u00a0: ZQ (chariotage avec épaulement), YQ (profilage).`;

  it('Given a covered material and operation in the URL When the guide renders Then the panel shows each proposed insert under its situation, its deduced field said so, without any speed, and the status announces it', async () => {
    const { page, navigations } = await openGuide(
      `${GUIDE_PATH}?matiere=${ALPHA.slug}&operation=finition-exterieure`,
      withRecommendation,
    );
    const panel = page.one('insert-guide-recommendation');

    expect({
      codes: page.texts('iso-insert-code'),
      situations: page.texts('iso-insert-situation'),
      deduced: page.texts('source-citation-mention', panel),
      speed: ['123', '456', 'm/min'].filter((text) => panel?.textContent?.includes(text)),
      unavailable: page.one('insert-guide-unavailable'),
      status: page.text('insert-guide-status'),
      navigations: navigations(),
    }).toEqual({
      codes: ['ZQ', 'YQ'],
      situations: ['Chariotage avec épaulement', 'Profilage'],
      deduced: ['déduit des principes du fabricant'],
      speed: [],
      unavailable: null,
      status: availableStatus,
      navigations: 1,
    });
  });

  it('Given a chosen material When a covered operation is chosen after an uncovered one Then the status moves from the absence to the proposed insert', async () => {
    const { page } = await openGuide(
      `${GUIDE_PATH}?matiere=${ALPHA.slug}&operation=gorge`,
      withRecommendation,
    );
    const statuses: string[] = [page.text('insert-guide-status')];

    await page.chooseOperation('finition-exterieure');
    statuses.push(page.text('insert-guide-status'));

    expect(statuses).toEqual([unavailableStatus(ALPHA, 'Gorge'), availableStatus]);
  });
});
