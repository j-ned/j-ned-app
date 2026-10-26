import { InjectionToken } from '@angular/core';
import { ISO_513_GROUPS } from '../domain/iso-groups.static-data';
import { MATERIALS } from '../domain/materials.static-data';
import type { InsertGuideReference } from '../domain/models/insert-guide-reference.model';
import { OPERATION_FAMILIES } from '../domain/operations.static-data';
import { RECOMMENDATIONS } from '../domain/recommendations.static-data';
import { SOURCES } from '../domain/sources.static-data';

export const INSERT_GUIDE_REFERENCE = new InjectionToken<InsertGuideReference>(
  'INSERT_GUIDE_REFERENCE',
  {
    providedIn: 'root',
    factory: (): InsertGuideReference => ({
      sources: SOURCES,
      isoGroups: ISO_513_GROUPS,
      families: OPERATION_FAMILIES,
      materials: MATERIALS,
      recommendations: RECOMMENDATIONS,
    }),
  },
);
