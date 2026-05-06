import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, Subject, switchMap, startWith } from 'rxjs';
import type { HomeGateway } from '../../domain';
import type { HeroData, HomeBundle, HomeHighlight, ServicePricing } from '../../domain';
import type { Project } from '@features/projects/domain';
import { API_BASE_URL } from '@shared/api';

function resolveProject(apiUrl: string, p: Project): Project {
  if (!p.image) return p;
  const image = p.image.startsWith('http') ? p.image : `${apiUrl}${p.image}`;
  return { ...p, image };
}

@Injectable()
export class HttpHomeGateway implements HomeGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private readonly _refresh$ = new Subject<void>();

  private readonly bundle$ = this._refresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http.get<HomeBundle>(`${this.apiUrl}/home-bundle`).pipe(
        map((bundle) => ({
          ...bundle,
          featuredProjects: bundle.featuredProjects.map((p) => resolveProject(this.apiUrl, p)),
        })),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getHomeBundle(): Observable<HomeBundle> {
    return this.bundle$;
  }

  invalidateBundle(): void {
    this._refresh$.next();
  }

  getHeroData(): Observable<HeroData> {
    return this.http.get<HeroData>(`${this.apiUrl}/hero`);
  }

  getServicePricing(): Observable<readonly ServicePricing[]> {
    return this.http
      .get<ServicePricing[]>(`${this.apiUrl}/service-pricing`)
      .pipe(catchError(() => of([])));
  }

  getHeroDataForEdit(): Observable<HeroData> {
    return this.http.get<HeroData>(`${this.apiUrl}/hero`);
  }

  updateHeroData(data: Partial<HeroData>): Observable<HeroData> {
    return this.http.patch<HeroData>(`${this.apiUrl}/hero`, data);
  }

  getServicePricingById(id: string): Observable<ServicePricing> {
    return this.http.get<ServicePricing>(`${this.apiUrl}/service-pricing/${id}`);
  }

  createServicePricing(data: Omit<ServicePricing, 'id'>): Observable<ServicePricing> {
    return this.http.post<ServicePricing>(`${this.apiUrl}/service-pricing`, data);
  }

  updateServicePricing(id: string, data: Partial<ServicePricing>): Observable<ServicePricing> {
    return this.http.patch<ServicePricing>(`${this.apiUrl}/service-pricing/${id}`, data);
  }

  deleteServicePricing(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/service-pricing/${id}`);
  }

  getHomeHighlights(): Observable<readonly HomeHighlight[]> {
    return this.http
      .get<HomeHighlight[]>(`${this.apiUrl}/highlights/home`)
      .pipe(catchError(() => of([])));
  }

  getHomeHighlightById(id: string): Observable<HomeHighlight> {
    return this.http.get<HomeHighlight>(`${this.apiUrl}/highlights/home/${id}`);
  }

  createHomeHighlight(data: Omit<HomeHighlight, 'id'>): Observable<HomeHighlight> {
    return this.http.post<HomeHighlight>(`${this.apiUrl}/highlights/home`, data);
  }

  updateHomeHighlight(id: string, data: Partial<HomeHighlight>): Observable<HomeHighlight> {
    return this.http.patch<HomeHighlight>(`${this.apiUrl}/highlights/home/${id}`, data);
  }

  deleteHomeHighlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/highlights/home/${id}`);
  }
}
