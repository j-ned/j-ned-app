import type { Observable } from 'rxjs';
import type { ProfileContent, ProfileDocument } from '../models/profile-content.model';

export abstract class ProfileGateway {
  abstract getProfile(): Observable<ProfileDocument>;
  abstract saveProfile(content: ProfileContent, version: number): Observable<ProfileDocument>;
  abstract uploadPortrait(file: File): Observable<ProfileDocument>;
  abstract removePortrait(): Observable<void>;
}
