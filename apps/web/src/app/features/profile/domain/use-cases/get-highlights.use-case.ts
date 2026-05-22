import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { Highlight } from '../models';

@Injectable({ providedIn: 'root' })
export class GetHighlightsUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<readonly Highlight[]> {
    return this._gateway.getHighlights();
  }
}
