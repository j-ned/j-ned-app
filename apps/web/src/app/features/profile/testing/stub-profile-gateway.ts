import { defer, of, type Observable } from 'rxjs';
import { ProfileGateway } from '../domain/gateways/profile.gateway';
import type { ProfileDocument } from '../domain/models/profile-content.model';
import { aProfileDocument } from './profile-builders';

class StubProfileGateway extends ProfileGateway {
  getProfile(): Observable<ProfileDocument> {
    return defer(() => of(aProfileDocument()));
  }

  saveProfile(): Observable<ProfileDocument> {
    return defer(() => of(aProfileDocument()));
  }

  uploadPortrait(): Observable<ProfileDocument> {
    return defer(() => of(aProfileDocument()));
  }

  removePortrait(): Observable<void> {
    return defer(() => of(undefined));
  }
}

export function stubProfileGateway(overrides: Partial<ProfileGateway> = {}): ProfileGateway {
  return Object.assign(new StubProfileGateway(), overrides);
}
