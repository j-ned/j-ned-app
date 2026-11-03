import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AdminProjectPreview } from './admin-project-preview';

const DASHFLOW = makeProject({
  id: 'p-1',
  slug: 'dashflow',
  title: 'DashFlow',
  category: 'Application Web',
  kind: 'production',
  order: 3,
  tags: ['Angular', 'NestJS'],
  description: 'Budget et santé du foyer. Auto-hébergé.',
  pitch: 'Le foyer dans une seule app.',
  image: '',
});

async function renderPreview(
  project: Project | null,
  pendingCover?: boolean,
): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(AdminProjectPreview);
  fixture.componentRef.setInput('project', project);
  if (pendingCover !== undefined) fixture.componentRef.setInput('pendingCover', pendingCover);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe('AdminProjectPreview: carte publique', () => {
  it('Given a production project without pitch When the preview renders Then the case study reads the first sentence of the description, as on the site', async () => {
    const host = await renderPreview(makeProject({ ...DASHFLOW, pitch: null }));

    expect(testIdText(host, 'project-case-study-pitch')).toBe('Budget et santé du foyer.');
  });
});

describe('AdminProjectPreview: couverture en attente', () => {
  it.each([
    { pendingCover: true, shown: true },
    { pendingCover: false, shown: false },
    { pendingCover: undefined, shown: false },
  ])(
    'Given a pending cover $pendingCover When the preview renders Then the notice shows: $shown',
    async ({ pendingCover, shown }) => {
      const host = await renderPreview(DASHFLOW, pendingCover);
      const element = byTestId(host, 'admin-project-preview-pending-cover');

      expect(element !== null).toBe(shown);
    },
  );
});
