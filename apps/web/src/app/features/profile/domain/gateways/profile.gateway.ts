import type { Observable } from 'rxjs';
import type { ProfileInfo, SocialButton } from '../models/profile.model';
import type { Biography } from '@features/profile/domain';
import type { Diploma } from '../models/diploma.model';
import type { Technology } from '@features/profile/domain';
import type { Highlight } from '@features/profile/domain';
import type { WhatIDo, WhatISeek } from '@features/profile/domain';

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
