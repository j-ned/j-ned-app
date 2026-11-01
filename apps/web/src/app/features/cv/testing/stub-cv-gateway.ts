import { of } from 'rxjs';
import type { CvGateway } from '../domain/gateways/cv.gateway';
import { makeCvInfo } from './cv-builders';

export const STUB_CV_DOWNLOAD_URL = '/api/cv/download';

export function stubCvGateway(overrides: Partial<CvGateway> = {}): CvGateway {
  return {
    upload: () => of(makeCvInfo()),
    delete: () => of(undefined),
    getCurrent: () => of(makeCvInfo()),
    getDownloadUrl: () => STUB_CV_DOWNLOAD_URL,
    ...overrides,
  };
}
