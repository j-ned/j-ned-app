import type { ActivatedRouteSnapshot } from '@angular/router';

// Une URL devinée par un scanner finit sur la route joker : ce n'est pas une page vue.
export function isNotFoundRoute(root: ActivatedRouteSnapshot): boolean {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.routeConfig?.path === '**';
}
