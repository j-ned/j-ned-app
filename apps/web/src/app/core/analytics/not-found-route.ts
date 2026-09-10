import type { ActivatedRouteSnapshot } from '@angular/router';

/** Vrai quand la navigation a fini sur la route joker `**` : une URL devinée par un scanner n'est pas une page vue. */
export function isNotFoundRoute(root: ActivatedRouteSnapshot): boolean {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.routeConfig?.path === '**';
}
