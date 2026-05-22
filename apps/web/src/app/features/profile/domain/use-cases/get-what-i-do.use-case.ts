import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { WhatIDo } from '../models';

@Injectable({ providedIn: 'root' })
export class GetWhatIDoUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<readonly WhatIDo[]> {
    return this._gateway.getWhatIDo();
  }
}
