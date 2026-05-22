import type { Observable } from 'rxjs';
import type { HeroData, HomeBundle, HomeHighlight } from '../models';

export abstract class HomeGateway {
  abstract getHomeBundle(): Observable<HomeBundle>;
  abstract invalidateBundle(): void;
  abstract getHeroData(): Observable<HeroData>;
  abstract getHomeHighlights(): Observable<readonly HomeHighlight[]>;
}
