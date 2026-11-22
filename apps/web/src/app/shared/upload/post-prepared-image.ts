import type { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { switchMap, type Observable } from 'rxjs';
import type { ImageUploadPreparer } from './image-upload-preparer';

export function postPreparedImage<T>(upload: {
  readonly http: HttpClient;
  readonly prepare: ImageUploadPreparer;
  readonly url: string;
  readonly file: File;
  readonly context: HttpContext;
  readonly fields?: Readonly<Record<string, string>>;
  readonly headers?: HttpHeaders;
}): Observable<T> {
  return upload.prepare(upload.file).pipe(
    switchMap((prepared) => {
      const formData = new FormData();
      formData.append('file', prepared);
      for (const [name, value] of Object.entries(upload.fields ?? {})) {
        formData.append(name, value);
      }
      return upload.http.post<T>(upload.url, formData, {
        context: upload.context,
        ...(upload.headers ? { headers: upload.headers } : {}),
      });
    }),
  );
}
