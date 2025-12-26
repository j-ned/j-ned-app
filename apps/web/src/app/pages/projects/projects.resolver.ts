import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GetStructuredDataUseCase } from '../../core/seo/use-cases/get-structured-data.use-case';

export const projectsSeoResolver: ResolveFn<void> = () => {
  const structuredDataUseCase = inject(GetStructuredDataUseCase);
  structuredDataUseCase.execute('/projects');
};
