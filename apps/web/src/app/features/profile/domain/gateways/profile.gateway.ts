import type { Observable } from 'rxjs';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../models';

export abstract class ProfileGateway {
  abstract getProfileInfo(): Observable<ProfileInfo>;
  abstract getBiography(): Observable<Biography>;
  abstract getSocialButtons(): Observable<readonly SocialButton[]>;
  abstract getDiplomas(): Observable<readonly Diploma[]>;
  abstract getTechnologies(): Observable<readonly Technology[]>;
  abstract getHighlights(): Observable<readonly Highlight[]>;
  abstract getWhatIDo(): Observable<readonly WhatIDo[]>;
  abstract getWhatISeek(): Observable<WhatISeek>;
}
