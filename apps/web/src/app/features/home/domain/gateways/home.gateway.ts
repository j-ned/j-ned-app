import type { Observable } from 'rxjs';
import type { HeroData, HomeBundle, HomeHighlight } from '../models';

export type HomeGateway = {
  getHomeBundle(): Observable<HomeBundle>;
  invalidateBundle(): void;
  getHeroData(): Observable<HeroData>;
  getHomeHighlights(): Observable<readonly HomeHighlight[]>;
};
