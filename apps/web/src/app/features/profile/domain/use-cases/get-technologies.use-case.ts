import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { Technology } from '../models';

@Injectable({ providedIn: 'root' })
export class GetTechnologiesUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<readonly Technology[]> {
    return this._gateway.getTechnologies();
  }
}
