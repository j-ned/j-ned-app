import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { ProfileInfo } from '../models';

@Injectable({ providedIn: 'root' })
export class GetProfileInfoUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<ProfileInfo> {
    return this._gateway.getProfileInfo();
  }
}
