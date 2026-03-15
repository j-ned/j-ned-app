import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import type { HomeGateway } from '../../domain';
import type { HeroData, HomeHighlight, ServicePricing } from '../../domain';
import { API_BASE_URL } from '@shared/api';

@Injectable()
export class HttpHomeGateway implements HomeGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

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
      .get<HomeHighlight[]>(`${this.apiUrl}/home-highlights`)
      .pipe(catchError(() => of([])));
  }

  getHomeHighlightById(id: string): Observable<HomeHighlight> {
    return this.http.get<HomeHighlight>(`${this.apiUrl}/home-highlights/${id}`);
  }

  createHomeHighlight(data: Omit<HomeHighlight, 'id'>): Observable<HomeHighlight> {
    return this.http.post<HomeHighlight>(`${this.apiUrl}/home-highlights`, data);
  }

  updateHomeHighlight(id: string, data: Partial<HomeHighlight>): Observable<HomeHighlight> {
    return this.http.patch<HomeHighlight>(`${this.apiUrl}/home-highlights/${id}`, data);
  }

  deleteHomeHighlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/home-highlights/${id}`);
  }
}
