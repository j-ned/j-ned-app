import type { Observable } from 'rxjs';
import type { HeroData } from '../models/hero.model';
import type { HomeBundle } from '@features/home/domain/models/home-bundle.model';
import type { HomeHighlight } from '@features/home/domain/models/home-highlight.model';

export abstract class HomeGateway {
  abstract getHomeBundle(): Observable<HomeBundle>;
  abstract invalidateBundle(): void;
  abstract getHeroData(): Observable<HeroData>;
  abstract getHomeHighlights(): Observable<readonly HomeHighlight[]>;
}
