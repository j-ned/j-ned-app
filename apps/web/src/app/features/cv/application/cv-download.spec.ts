import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import { CvGateway } from '../domain/gateways/cv.gateway';
import { HttpCvGateway } from '../infra/gateways/http-cv.gateway';
import { makeCvInfo } from '../testing/cv-builders';
import { CvDownload } from './cv-download';

const API = '/api';

type CvAnswer = (request: TestRequest) => void;

const PUBLISHED_CV: CvAnswer = (request) => request.flush(makeCvInfo());
const NO_CV: CvAnswer = (request) => request.flush(null);
const CV_FAILURE: CvAnswer = (request) =>
  request.flush(null, { status: 500, statusText: 'Server Error' });

describe('CvDownload', () => {
  let http: HttpTestingController;
  const trackCvDownload = vi.fn();
  const trackCtaClick = vi.fn();

  const readCv = async (answer: CvAnswer): Promise<CvDownload> => {
    const download = TestBed.inject(CvDownload);
    TestBed.tick();
    const requests = http.match(`${API}/cv`);
    expect(requests).toHaveLength(1);
    answer(requests[0]);
    await TestBed.inject(ApplicationRef).whenStable();
    return download;
  };

  beforeEach(() => {
    trackCvDownload.mockClear();
    trackCtaClick.mockClear();
    TestBed.configureTestingModule({
      providers: [
        CvDownload,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
        { provide: CvGateway, useClass: HttpCvGateway },
        {
          provide: AnalyticsGateway,
          useValue: stubAnalyticsGateway({ trackCvDownload, trackCtaClick }),
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('Given a published CV When it is read Then the download url is the stable public one', async () => {
    const download = await readCv(PUBLISHED_CV);

    expect(download.url()).toBe(`${API}/cv/download`);
  });

  it.each<{ label: string; answer: CvAnswer }>([
    { label: 'no CV', answer: NO_CV },
    { label: 'an API error', answer: CV_FAILURE },
  ])('Given $label When the CV is read Then there is no download url', async ({ answer }) => {
    const download = await readCv(answer);

    expect(download.url()).toBeNull();
  });

  it('Given a download When it is tracked Then the CV download is measured once, and nothing else', async () => {
    const download = await readCv(PUBLISHED_CV);

    download.track();

    expect(trackCvDownload).toHaveBeenCalledOnce();
    expect(trackCtaClick).not.toHaveBeenCalled();
  });
});
