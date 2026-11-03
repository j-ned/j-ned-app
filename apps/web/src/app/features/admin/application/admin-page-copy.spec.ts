import {
  audienceOverline,
  cvOverline,
  messagesOverline,
  postsOverline,
  projectsOverline,
  todayOverline,
} from './admin-page-copy';
import { makeProject } from '@features/projects/testing/project-builders';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { makeCvInfo } from '@features/cv/testing/cv-builders';

const projects = (total: number, featured: number): ReturnType<typeof makeProject>[] =>
  Array.from({ length: total }, (_, index) =>
    makeProject({ id: `p-${index}`, featured: index < featured }),
  );

const posts = (published: number, drafts: number): ReturnType<typeof makeBlogPost>[] => [
  ...Array.from({ length: published }, (_, index) =>
    makeBlogPost({ id: `pub-${index}`, status: 'published' }),
  ),
  ...Array.from({ length: drafts }, (_, index) =>
    makeBlogPost({ id: `draft-${index}`, status: 'draft', publishedAt: null }),
  ),
];

const messages = (unread: number, read: number): ReturnType<typeof makeContactMessage>[] => [
  ...Array.from({ length: unread }, (_, index) => makeContactMessage({ id: index, read: false })),
  ...Array.from({ length: read }, (_, index) =>
    makeContactMessage({ id: unread + index, read: true }),
  ),
];

describe('projectsOverline', () => {
  it.each([
    { total: 1, featured: 0, overline: '1 réalisation · 0 mise en avant' },
    {
      total: 1234,
      featured: 1000,
      overline: '1\u202f234 réalisations · 1\u202f000 mises en avant',
    },
  ])(
    'Given $total project(s) of which $featured featured When the overline is written Then it reads « $overline »',
    ({ total, featured, overline }) => {
      expect(projectsOverline(projects(total, featured))).toBe(overline);
    },
  );
});

describe('postsOverline', () => {
  it.each([
    { published: 1, drafts: 2, overline: '3 articles · 1 publié · 2 brouillons' },
    {
      published: 1000,
      drafts: 234,
      overline: '1\u202f234 articles · 1\u202f000 publiés · 234 brouillons',
    },
  ])(
    'Given $published published and $drafts draft(s) When the overline is written Then it reads « $overline »',
    ({ published, drafts, overline }) => {
      expect(postsOverline(posts(published, drafts))).toBe(overline);
    },
  );
});

describe('messagesOverline', () => {
  it.each([
    { unread: 2, read: 1, overline: '2 non lus · 3 au total' },
    { unread: 1200, read: 34, overline: '1\u202f200 non lus · 1\u202f234 au total' },
  ])(
    'Given $unread unread and $read read message(s) When the overline is written Then it reads « $overline »',
    ({ unread, read, overline }) => {
      expect(messagesOverline(messages(unread, read))).toBe(overline);
    },
  );
});

describe('cvOverline', () => {
  it.each([
    { fileSize: 512, size: '512 o' },
    { fileSize: 1_258_291, size: '1,2 Mo' },
  ])(
    'Given a PDF of $fileSize bytes uploaded on 19 September 2026 When the overline is written Then it reads its format, « $size » and its date',
    ({ fileSize, size }) => {
      const cv = makeCvInfo({
        fileSize,
        mimeType: 'application/pdf',
        uploadedAt: '2026-09-19T10:00:00.000Z',
      });

      expect(cvOverline(cv)).toBe(`PDF · ${size} · mis en ligne le 19 sept. 2026`);
    },
  );

  it('Given no CV online When the overline is written Then it says so', () => {
    expect(cvOverline(null)).toBe('Aucun CV en ligne');
  });
});

describe('audienceOverline', () => {
  const OCTOBER_7 = new Date(2026, 9, 7, 10, 0);

  it.each([
    {
      range: '30d',
      now: new Date(2026, 0, 10, 10, 0),
      overline: '11 déc. 2025 au 10 janv. 2026 · 30 derniers jours',
    },
    { range: 'all', now: OCTOBER_7, overline: 'Tout le temps' },
  ] as const)(
    'Given the range $range When the overline is written Then it reads « $overline »',
    ({ range, now, overline }) => {
      expect(audienceOverline(range, now)).toBe(overline);
    },
  );
});

describe('todayOverline', () => {
  it.each([
    {
      day: 'a Wednesday morning',
      now: new Date(2026, 9, 7, 10, 0),
      overline: 'Mercredi 7 octobre 2026',
    },
    {
      day: 'a Sunday late evening',
      now: new Date(2026, 4, 31, 23, 30),
      overline: 'Dimanche 31 mai 2026',
    },
  ])('Given $day When the overline is written Then it reads « $overline »', ({ now, overline }) => {
    expect(todayOverline(now)).toBe(overline);
  });
});
