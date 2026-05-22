import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { Biography } from '../models';

@Injectable({ providedIn: 'root' })
export class GetBiographyUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<Biography> {
    return this._gateway.getBiography();
  }
}
