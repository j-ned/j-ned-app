import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { UmamiStats, UmamiActive, UmamiMetric } from './umami.model';

@Injectable({ providedIn: 'root' })
export class UmamiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.umamiApiUrl;
  private readonly shareId = environment.umamiShareId;
  private readonly websiteId = environment.umamiWebsiteId;

  private shareToken: string | null = null;

  async getShareToken(): Promise<string> {
    if (this.shareToken) return this.shareToken;

    const res = await firstValueFrom(
      this.http.get<{ token: string }>(`${this.apiUrl}/api/share/${this.shareId}`),
    );
    this.shareToken = res.token;
    return res.token;
  }

  async getStats(startAt: number, endAt: number): Promise<UmamiStats> {
    const token = await this.getShareToken();
    return firstValueFrom(
      this.http.get<UmamiStats>(`${this.apiUrl}/api/websites/${this.websiteId}/stats`, {
        headers: { 'x-umami-share-token': token },
        params: { startAt: startAt.toString(), endAt: endAt.toString() },
      }),
    );
  }

  async getActive(): Promise<UmamiActive> {
    const token = await this.getShareToken();
    return firstValueFrom(
      this.http.get<UmamiActive>(`${this.apiUrl}/api/websites/${this.websiteId}/active`, {
        headers: { 'x-umami-share-token': token },
      }),
    );
  }

  async getMetrics(
    startAt: number,
    endAt: number,
    type: string,
  ): Promise<readonly UmamiMetric[]> {
    const token = await this.getShareToken();
    return firstValueFrom(
      this.http.get<UmamiMetric[]>(`${this.apiUrl}/api/websites/${this.websiteId}/metrics`, {
        headers: { 'x-umami-share-token': token },
        params: { startAt: startAt.toString(), endAt: endAt.toString(), type },
      }),
    );
  }
}
