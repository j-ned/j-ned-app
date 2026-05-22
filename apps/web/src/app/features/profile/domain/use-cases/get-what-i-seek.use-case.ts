import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { WhatISeek } from '../models';

@Injectable({ providedIn: 'root' })
export class GetWhatISeekUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<WhatISeek> {
    return this._gateway.getWhatISeek();
  }
}
