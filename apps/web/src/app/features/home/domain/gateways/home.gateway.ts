import type { Observable } from 'rxjs';
import type { HeroData, HomeBundle, HomeHighlight, ServicePricing } from '../models';

export type HomeGateway = {
  getHomeBundle(): Observable<HomeBundle>;
  getHeroData(): Observable<HeroData>;
  getServicePricing(): Observable<readonly ServicePricing[]>;
  getHomeHighlights(): Observable<readonly HomeHighlight[]>;

  getHeroDataForEdit(): Observable<HeroData>;
  updateHeroData(data: Partial<HeroData>): Observable<HeroData>;

  getServicePricingById(id: string): Observable<ServicePricing>;
  createServicePricing(data: Omit<ServicePricing, 'id'>): Observable<ServicePricing>;
  updateServicePricing(id: string, data: Partial<ServicePricing>): Observable<ServicePricing>;
  deleteServicePricing(id: string): Observable<void>;

  getHomeHighlightById(id: string): Observable<HomeHighlight>;
  createHomeHighlight(data: Omit<HomeHighlight, 'id'>): Observable<HomeHighlight>;
  updateHomeHighlight(id: string, data: Partial<HomeHighlight>): Observable<HomeHighlight>;
  deleteHomeHighlight(id: string): Observable<void>;
};
