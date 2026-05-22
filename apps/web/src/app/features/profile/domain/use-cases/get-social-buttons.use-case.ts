import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ProfileGateway } from '../gateways/profile.gateway';
import type { SocialButton } from '../models';

@Injectable({ providedIn: 'root' })
export class GetSocialButtonsUseCase {
  private readonly _gateway = inject(ProfileGateway);

  execute(): Observable<readonly SocialButton[]> {
    return this._gateway.getSocialButtons();
  }
}
