import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { Diploma } from '../models';

@Injectable({ providedIn: 'root' })
export class GetDiplomasUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<readonly Diploma[]> {
    return this._gateway.getDiplomas();
  }
}
