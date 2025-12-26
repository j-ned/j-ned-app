import { inject, Injectable } from '@angular/core';
import { CONTACT_GATEWAY } from '../gateways';

@Injectable({ providedIn: 'root' })
export class GetContactInfoUseCase {
  private gateway = inject(CONTACT_GATEWAY);

  execute() {
    return this.gateway.getContactInfo();
  }
}
