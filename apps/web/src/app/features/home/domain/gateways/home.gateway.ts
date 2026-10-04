import type { Observable } from 'rxjs';
import type { HomeBundle } from '@features/home/domain/models/home-bundle.model';

export abstract class HomeGateway {
  abstract getHomeBundle(): Observable<HomeBundle>;
  abstract invalidateBundle(): void;
}
