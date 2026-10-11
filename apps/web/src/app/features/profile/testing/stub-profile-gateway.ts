import { defer, of, type Observable } from 'rxjs';
import { ProfileGateway } from '../domain/gateways/profile.gateway';
import type { ProfileDocument } from '../domain/models/profile-content.model';
import { aProfileDocument } from './profile-builders';

class StubProfileGateway extends ProfileGateway {
  getProfile(): Observable<ProfileDocument> {
    return defer(() => of(aProfileDocument()));
  }
}

export function stubProfileGateway(overrides: Partial<ProfileGateway> = {}): ProfileGateway {
  return Object.assign(new StubProfileGateway(), overrides);
}
