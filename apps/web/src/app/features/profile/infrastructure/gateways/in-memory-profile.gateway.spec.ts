import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '@shared/api';
import { InMemoryProfileGateway } from './in-memory-profile.gateway';
import {
  STATIC_PROFILE_BASE,
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
  let httpController: HttpTestingController;
  const apiBase = 'http://test.local/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryProfileGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: apiBase },
      ],
    });
    gateway = TestBed.inject(InMemoryProfileGateway);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  it('getProfileInfo merges static base with dynamic avatarUrl from /profile API', async () => {
    const promise = firstValueFrom(gateway.getProfileInfo());
    const req = httpController.expectOne(`${apiBase}/profile`);
    expect(req.request.method).toBe('GET');
    req.flush({ ...STATIC_PROFILE_BASE, avatarUrl: '/uploads/avatar.jpg' });

    const result = await promise;
    expect(result).toEqual({ ...STATIC_PROFILE_BASE, avatarUrl: '/uploads/avatar.jpg' });
  });

  it('getProfileInfo falls back to empty avatarUrl on API error', async () => {
    const promise = firstValueFrom(gateway.getProfileInfo());
    const req = httpController.expectOne(`${apiBase}/profile`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.avatarUrl).toBe('');
    expect(result.displayName).toBe(STATIC_PROFILE_BASE.displayName);
  });

  it('uploadAvatar POSTs FormData and returns the URL', async () => {
    const file = new File(['x'], 'avatar.jpg', { type: 'image/jpeg' });
    const promise = firstValueFrom(gateway.uploadAvatar(file));

    const req = httpController.expectOne(`${apiBase}/profile/avatar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({ url: '/uploads/new-avatar.jpg' });

    const result = await promise;
    expect(result).toBe('/uploads/new-avatar.jpg');
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
