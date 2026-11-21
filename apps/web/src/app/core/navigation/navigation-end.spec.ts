import { NavigationEnd, NavigationStart, type Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { navigationEnd$ } from './navigation-end';

describe('navigationEnd$', () => {
  it('Given router events of several kinds When they are emitted Then only the completed navigations come through', () => {
    const events = new Subject<RouterEvent>();
    const seen: string[] = [];
    const subscription = navigationEnd$({ events }).subscribe((event) =>
      seen.push(event.urlAfterRedirects),
    );

    events.next(new NavigationStart(1, '/blog'));
    events.next(new NavigationEnd(1, '/blog', '/blog'));
    events.next(new NavigationStart(2, '/old'));
    events.next(new NavigationEnd(2, '/old', '/new'));
    subscription.unsubscribe();

    expect(seen).toEqual(['/blog', '/new']);
  });
});
