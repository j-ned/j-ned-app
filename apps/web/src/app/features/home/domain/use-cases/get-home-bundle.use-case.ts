import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { HomeGateway } from '../gateways/home.gateway';
import type { HomeBundle } from '../models';

@Injectable({ providedIn: 'root' })
export class GetHomeBundleUseCase {
  private readonly _gateway = inject(HomeGateway);

  execute(): Observable<HomeBundle> {
    return this._gateway.getHomeBundle();
  }
}
