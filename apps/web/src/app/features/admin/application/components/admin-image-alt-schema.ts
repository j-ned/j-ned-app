import { schema, validate } from '@angular/forms/signals';

const ALT_MAX_LENGTH = 300;

export const imageAltSchema = schema<{ alt: string }>((path) => {
  validate(path.alt, ({ value }) => {
    const alt = value().trim();
    if (!alt) return { kind: 'required', message: 'Ce champ est obligatoire' };
    if (alt.length > ALT_MAX_LENGTH) {
      return { kind: 'maxLength', message: `${ALT_MAX_LENGTH} caractères au plus` };
    }
    return null;
  });
});
