import { routes } from '../app.routes';

export type EditorialText = { readonly path: string; readonly text: string };

export const editorialTexts = (value: unknown, path: string): readonly EditorialText[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => editorialTexts(item, `${path}[${index}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => editorialTexts(item, `${path}.${key}`));
  }
  return [];
};

export const ROUTE_TEXTS = Object.fromEntries(
  routes.map(({ path, title, data }) => [`/${path ?? ''}`, { title, seo: data?.['seo'] }]),
);
