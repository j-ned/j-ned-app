import { NavigationEnd, type Router } from '@angular/router';
import { type Observable, filter } from 'rxjs';

export const navigationEnd$ = (router: Pick<Router, 'events'>): Observable<NavigationEnd> =>
  router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd));
