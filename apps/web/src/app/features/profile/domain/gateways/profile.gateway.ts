import type { Observable } from 'rxjs';
import type { ProfileDocument } from '../models/profile-content.model';

export abstract class ProfileGateway {
  abstract getProfile(): Observable<ProfileDocument>;
}
