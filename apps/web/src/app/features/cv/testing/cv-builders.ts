import type { CvInfo } from '../domain/models/cv.model';

export function makeCvInfo(overrides: Partial<CvInfo> = {}): CvInfo {
  return {
    id: 'cv-1',
    fileName: 'cv.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    uploadedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
