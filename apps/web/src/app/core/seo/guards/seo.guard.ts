import { inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { GetPageMetadataUseCase } from '../use-cases/get-page-metadata.use-case';

export const seoGuard = (route: ActivatedRouteSnapshot) => {
  const metadataUseCase = inject(GetPageMetadataUseCase);

  // Build the full route path
  let path = '';
  let currentRoute = route;
  while (currentRoute) {
    if (currentRoute.routeConfig?.path) {
      path = `/${currentRoute.routeConfig.path}${path}`;
    }
    currentRoute = currentRoute.parent!;
  }

  // Default to root if no path found
  if (!path) {
    path = '/';
  }

  // Execute use case to apply SEO metadata
  metadataUseCase.execute(path);

  return true;
};
