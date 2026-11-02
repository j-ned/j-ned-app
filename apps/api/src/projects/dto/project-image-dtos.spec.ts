import { invalidProperties } from '../../common/dto-testing';
import { validateDto } from '../../common/validation';
import { projectImageAltSchema } from './project-image-alt.dto';
import { reorderProjectImagesSchema } from './reorder-project-images.dto';

describe('ProjectImageAltDto', () => {
  it('Given an alt with surrounding spaces, When transformed, Then it is trimmed and accepted', () => {
    const dto = validateDto(projectImageAltSchema, {
      alt: '  Tableau de bord  ',
    });
    expect(dto.alt).toBe('Tableau de bord');
  });

  it('Given an alt of exactly 300 characters, When validated, Then it is accepted', () => {
    expect(
      invalidProperties(projectImageAltSchema, { alt: 'a'.repeat(300) }),
    ).toHaveLength(0);
  });

  it.each([
    ['missing', {}],
    ['empty', { alt: '' }],
    ['blank', { alt: '   ' }],
    ['301 characters', { alt: 'a'.repeat(301) }],
    ['not a string', { alt: 42 }],
    ['a list', { alt: ['Tableau de bord'] }],
    ['null', { alt: null }],
  ])('Given an alt %s, When validated, Then alt is rejected', (_, body) => {
    expect(invalidProperties(projectImageAltSchema, body)).toContain('alt');
  });
});

describe('ReorderProjectImagesDto', () => {
  const uuid = (n: number) =>
    `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`;

  it.each([
    ['an empty list', []],
    ['two UUIDs', [uuid(1), uuid(2)]],
    ['12 UUIDs', Array.from({ length: 12 }, (_, i) => uuid(i))],
  ])('Given %s, When validated, Then it is accepted', (_, imageIds) => {
    expect(
      invalidProperties(reorderProjectImagesSchema, { imageIds }),
    ).toHaveLength(0);
  });

  it.each([
    ['missing', {}],
    ['not an array', { imageIds: uuid(1) }],
    ['a non-UUID', { imageIds: [uuid(1), 'nope'] }],
    ['a duplicate', { imageIds: [uuid(1), uuid(1)] }],
    ['13 UUIDs', { imageIds: Array.from({ length: 13 }, (_, i) => uuid(i)) }],
  ])('Given %s, When validated, Then imageIds is rejected', (_, body) => {
    expect(invalidProperties(reorderProjectImagesSchema, body)).toContain(
      'imageIds',
    );
  });
});
