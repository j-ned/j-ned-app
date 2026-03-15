import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { API_BASE_URL } from '@shared/api';

export type SiteSettings = {
  readonly blogEnabled: boolean;
};

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private readonly settingsResource = rxResource({
    stream: () =>
      this.http.get<SiteSettings>(`${this.apiUrl}/settings`).pipe(
        catchError(() => of({ blogEnabled: true })),
      ),
  });

  readonly blogEnabled = (): boolean => this.settingsResource.value()?.blogEnabled ?? true;

  toggleBlog(): void {
    const newValue = !this.blogEnabled();
    this.http
      .patch<SiteSettings>(`${this.apiUrl}/settings`, { blogEnabled: newValue })
      .pipe(catchError(() => of(null)))
      .subscribe((settings) => {
        if (settings) this.settingsResource.reload();
      });
  }
}
