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
    this.supabase.client
      .rpc('track_project_click', { p_project_id: projectId, p_title: title })
      .then(({ error }) => {
        if (error) console.error('[Tracking] track_project_click failed:', error.message);
      });
  }

  trackArticleView(articleId: number, title: string): void {
    this.umamiTrack('article_view', { articleId, title });
    this.supabase.client
      .rpc('track_article_click', { p_article_id: articleId, p_title: title })
      .then(({ error }) => {
        if (error) console.error('[Tracking] track_article_click failed:', error.message);
      });
  }

  trackVisit(): void {
    this.supabase.client.rpc('track_visit').then(({ error }) => {
      if (error) console.error('[Tracking] track_visit failed:', error.message);
    });
  }

  trackCvDownload(): void {
    this.umamiTrack('cv_download');
    this.supabase.client.rpc('track_cv_download').then(({ error }) => {
      if (error) console.error('[Tracking] track_cv_download failed:', error.message);
    });
  }

  private umamiTrack(event: string, data?: Record<string, unknown>): void {
    (window as UmamiWindow).umami?.track(event, data);
  }
}
