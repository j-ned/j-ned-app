import type * as z from 'zod';
import { invalidProperties } from '../../common/dto-testing';
import { BadRequestException } from '../../common/http-errors';
import { validateDto } from '../../common/validation';
import { createProjectSchema } from './create-project.dto';
import { updateProjectSchema } from './update-project.dto';
import { PROJECT_FACT_MAX, PROJECT_PITCH_MAX } from '../project-editorial';

const base = { title: 'T', category: 'Web', description: 'D' };

describe('CreateProjectDto - techChoices / architectureDecisions', () => {
  it('accepte des listes valides', () => {
    expect(
      invalidProperties(createProjectSchema, {
        ...base,
        techChoices: [{ techno: 'NestJS', why: 'modulaire' }],
        architectureDecisions: [
          { decision: 'hexagonale', rationale: 'testable' },
        ],
      }),
    ).toHaveLength(0);
  });

  it("accepte l'absence des deux champs (optionnels)", () => {
    expect(invalidProperties(createProjectSchema, { ...base })).toHaveLength(0);
  });

  it('rejette un techChoice sans "why"', () => {
    expect(
      invalidProperties(createProjectSchema, {
        ...base,
        techChoices: [{ techno: 'NestJS' }],
      }).length,
    ).toBeGreaterThan(0);
  });

  it('rejette une architectureDecision sans "decision"', () => {
    expect(
      invalidProperties(createProjectSchema, {
        ...base,
        architectureDecisions: [{ rationale: 'testable' }],
      }).length,
    ).toBeGreaterThan(0);
  });
});

describe('CreateProjectDto - kind (ADR-0008)', () => {
  it.each(['production', 'demo', 'script'])(
    'Given kind "%s", When validated, Then it is accepted',
    (kind) => {
      expect(
        invalidProperties(createProjectSchema, { ...base, kind }),
      ).toHaveLength(0);
    },
  );

  it('Given no kind, When validated, Then it is accepted (the column default applies)', () => {
    expect(invalidProperties(createProjectSchema, { ...base })).toHaveLength(0);
  });

  it.each([['foo'], [null], [''], [42]])(
    'Given kind %p, When validated, Then kind is rejected',
    (kind) => {
      const errors = invalidProperties(createProjectSchema, { ...base, kind });
      expect(errors).toContain('kind');
    },
  );
});

describe('UpdateProjectDto - kind (ADR-0008)', () => {
  it('Given kind "script", When validated, Then it is accepted', () => {
    expect(
      invalidProperties(updateProjectSchema, { kind: 'script' }),
    ).toHaveLength(0);
  });

  it('Given an empty patch, When validated, Then it is accepted', () => {
    expect(invalidProperties(updateProjectSchema, {})).toHaveLength(0);
  });

  it.each([['foo'], [null]])(
    'Given kind %p, When validated, Then kind is rejected (NOT NULL column, no 500)',
    (kind) => {
      const errors = invalidProperties(updateProjectSchema, { kind });
      expect(errors).toContain('kind');
    },
  );

  it('Given title null, When validated, Then title is rejected instead of reaching the NOT NULL column', () => {
    const errors = invalidProperties(updateProjectSchema, { title: null });
    expect(errors).toContain('title');
  });

  it('Given image null and liveUrl null, When validated, Then the existing null semantics still hold', () => {
    expect(
      invalidProperties(updateProjectSchema, {
        image: null,
        liveUrl: null,
      }),
    ).toHaveLength(0);
  });
});

/** Même validation que les routes (`jsonBody`) : conversion implicite, transformations et liste blanche compris. */
const throughPipe = <T>(
  schema: z.ZodType<T>,
  body: Record<string, unknown>,
): Promise<T> => Promise.resolve().then(() => validateDto(schema, body));

/** Messages remontés par le 400, en JSON (`["pitch: …"]`) : le champ en cause est vérifié. */
const rejectionOf = async (
  schema: z.ZodType,
  body: Record<string, unknown>,
): Promise<string> => {
  const error: unknown = await throughPipe(schema, body).then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(BadRequestException);
  return JSON.stringify((error as BadRequestException).messages);
};

const EDITORIAL_FIELDS = [
  ['pitch', PROJECT_PITCH_MAX],
  ['highlight', PROJECT_FACT_MAX],
  ['scope', PROJECT_FACT_MAX],
] as const;

describe('CreateProjectDto - editorial fields (ADR-0010)', () => {
  it('Given the bounds, When read, Then they are 160 for the pitch and 80 for the facts', () => {
    expect(PROJECT_PITCH_MAX).toBe(160);
    expect(PROJECT_FACT_MAX).toBe(80);
  });

  it('Given the three fields, When created, Then they reach the service trimmed', async () => {
    const dto = await throughPipe(createProjectSchema, {
      ...base,
      pitch: '  Une phrase qui dit à quoi sert le projet.  ',
      highlight: 'Chiffrement de bout en bout côté client',
      scope: ' Conception, développement, déploiement ',
    });
    expect(dto).toMatchObject({
      pitch: 'Une phrase qui dit à quoi sert le projet.',
      highlight: 'Chiffrement de bout en bout côté client',
      scope: 'Conception, développement, déploiement',
    });
  });

  // Un champ absent reste absent du DTO (`undefined`) : c'est Drizzle qui ignore `undefined`
  // (colonne NULL à l'insert, clé hors du SET d'un UPDATE).
  it('Given none of the three fields, When created, Then they stay undefined (the column is NULL)', async () => {
    const dto = await throughPipe(createProjectSchema, { ...base });
    expect(dto.pitch).toBeUndefined();
    expect(dto.highlight).toBeUndefined();
    expect(dto.scope).toBeUndefined();
  });

  describe.each(EDITORIAL_FIELDS)('%s (max %i)', (field, max) => {
    it(`Given exactly ${max} characters, When created, Then it is accepted`, async () => {
      const dto = await throughPipe(createProjectSchema, {
        ...base,
        [field]: 'a'.repeat(max),
      });
      expect(dto[field]).toHaveLength(max);
    });

    it(`Given ${max} characters surrounded by spaces, When created, Then the bound applies after trim`, async () => {
      const dto = await throughPipe(createProjectSchema, {
        ...base,
        [field]: `  ${'a'.repeat(max)}  `,
      });
      expect(dto[field]).toBe('a'.repeat(max));
    });

    it(`Given ${max + 1} characters, When created, Then the request is rejected on maxLength`, async () => {
      const response = await rejectionOf(createProjectSchema, {
        ...base,
        [field]: 'a'.repeat(max + 1),
      });
      expect(response).toContain(`"${field}: `);
    });

    it.each([[null], [''], ['   ']])(
      'Given %p, When created, Then it is accepted as null',
      async (value) => {
        const dto = await throughPipe(createProjectSchema, {
          ...base,
          [field]: value,
        });
        expect(dto[field]).toBeNull();
      },
    );

    it.each([[42], [true], [['x']], [{ text: 'x' }]])(
      'Given the non-string %p, When created, Then the request is rejected on isString',
      async (value) => {
        const response = await rejectionOf(createProjectSchema, {
          ...base,
          [field]: value,
        });
        expect(response).toContain(`"${field}: `);
      },
    );
  });
});

describe('UpdateProjectDto - editorial fields (ADR-0010, inherited through PartialType)', () => {
  describe.each(EDITORIAL_FIELDS)('%s (max %i)', (field, max) => {
    it.each([[null], [''], ['   ']])(
      'Given %p, When patched, Then it is accepted as null (the value is cleared)',
      async (value) => {
        const dto = await throughPipe(updateProjectSchema, { [field]: value });
        expect(dto[field]).toBeNull();
      },
    );

    it('Given a padded value, When patched, Then it reaches the service trimmed', async () => {
      const dto = await throughPipe(updateProjectSchema, { [field]: '  x  ' });
      expect(dto[field]).toBe('x');
    });

    it(`Given exactly ${max} characters, When patched, Then it is accepted`, async () => {
      const dto = await throughPipe(updateProjectSchema, {
        [field]: 'a'.repeat(max),
      });
      expect(dto[field]).toHaveLength(max);
    });

    it(`Given ${max + 1} characters, When patched, Then the request is rejected on maxLength`, async () => {
      const response = await rejectionOf(updateProjectSchema, {
        [field]: 'a'.repeat(max + 1),
      });
      expect(response).toContain(`"${field}: `);
    });

    it('Given a number, When patched, Then the request is rejected on isString', async () => {
      const response = await rejectionOf(updateProjectSchema, { [field]: 42 });
      expect(response).toContain(`"${field}: `);
    });

    it('Given the field is absent, When patched, Then it stays undefined (left out of the SET)', async () => {
      const dto = await throughPipe(updateProjectSchema, { featured: true });
      expect(dto[field]).toBeUndefined();
    });
  });

  it.each(['title', 'category', 'description'] as const)(
    'Given null on the editorial fields, When %s is patched to null, Then it is still rejected (skipNullProperties: false)',
    async (required) => {
      const response = await rejectionOf(updateProjectSchema, {
        pitch: null,
        [required]: null,
      });
      expect(response).toContain(`"${required}: `);
      expect(response).not.toContain('pitch');
    },
  );
});
