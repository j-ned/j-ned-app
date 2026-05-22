import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InMemoryProfileGateway } from './in-memory-profile.gateway';
import {
  STATIC_PROFILE_BASE,
  STATIC_AVATAR_URL,
  STATIC_BIOGRAPHY,
  STATIC_DIPLOMAS,
  STATIC_TECHNOLOGIES,
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_WHAT_I_DO,
  STATIC_WHAT_I_SEEK,
  STATIC_SOCIAL_BUTTONS,
} from '../data/profile.static-data';

describe('InMemoryProfileGateway', () => {
  let gateway: InMemoryProfileGateway;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InMemoryProfileGateway],
    });
    gateway = TestBed.inject(InMemoryProfileGateway);
  });

  it('returns the static profile info with the static avatar URL', async () => {
    const result = await firstValueFrom(gateway.getProfileInfo());
    expect(result).toEqual({ ...STATIC_PROFILE_BASE, avatarUrl: STATIC_AVATAR_URL });
  });

  it('returns the static biography', async () => {
    const result = await firstValueFrom(gateway.getBiography());
    expect(result).toEqual(STATIC_BIOGRAPHY);
  });

  it('returns the static diplomas', async () => {
    const result = await firstValueFrom(gateway.getDiplomas());
    expect(result).toEqual([...STATIC_DIPLOMAS]);
  });

  it('returns the static technologies', async () => {
    const result = await firstValueFrom(gateway.getTechnologies());
    expect(result).toEqual([...STATIC_TECHNOLOGIES]);
  });

  it('returns the static about highlights', async () => {
    const result = await firstValueFrom(gateway.getHighlights());
    expect(result).toEqual([...STATIC_ABOUT_HIGHLIGHTS]);
  });

  it('returns the static what-i-do', async () => {
    const result = await firstValueFrom(gateway.getWhatIDo());
    expect(result).toEqual([...STATIC_WHAT_I_DO]);
  });

  it('returns the static what-i-seek', async () => {
    const result = await firstValueFrom(gateway.getWhatISeek());
    expect(result).toEqual(STATIC_WHAT_I_SEEK);
  });

  it('returns the static social buttons', async () => {
    const result = await firstValueFrom(gateway.getSocialButtons());
    expect(result).toEqual([...STATIC_SOCIAL_BUTTONS]);
  });
});
