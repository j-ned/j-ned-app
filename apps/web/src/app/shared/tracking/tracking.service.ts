import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client';

type UmamiWindow = Window & {
  umami?: { track: (event: string, data?: Record<string, unknown>) => void };
};

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly supabase = inject(SupabaseClientService);

  trackProjectClick(projectId: string, title: string): void {
    this.umamiTrack('project_click', { projectId, title });
    this.supabase.client.rpc('track_project_click', { p_project_id: projectId, p_title: title });
  }

  trackArticleView(articleId: number, title: string): void {
    this.umamiTrack('article_view', { articleId, title });
    this.supabase.client.rpc('track_article_click', { p_article_id: articleId, p_title: title });
  }

  trackVisit(): void {
    this.supabase.client.rpc('track_visit');
  }

  trackCvDownload(): void {
    this.umamiTrack('cv_download');
    this.supabase.client.rpc('track_cv_download');
  }

  private umamiTrack(event: string, data?: Record<string, unknown>): void {
    (window as UmamiWindow).umami?.track(event, data);
  }
}
