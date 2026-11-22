import type { HttpClient, HttpContext, HttpHeaders, HttpResponse } from '@angular/common/http';
import { switchMap, type Observable } from 'rxjs';
import type { ImageUploadPreparer } from './image-upload-preparer';

type PreparedImageUpload = {
  readonly http: HttpClient;
  readonly prepare: ImageUploadPreparer;
  readonly url: string;
  readonly file: File;
  readonly context: HttpContext;
  readonly fields?: Readonly<Record<string, string>>;
  readonly headers?: HttpHeaders;
};

export function postPreparedImage<T>(upload: PreparedImageUpload): Observable<T> {
  return upload.prepare(upload.file).pipe(
    switchMap((prepared) =>
      upload.http.post<T>(upload.url, formOf(prepared, upload.fields), {
        context: upload.context,
        ...(upload.headers ? { headers: upload.headers } : {}),
      }),
    ),
  );
}

// La réponse entière : ses en-têtes portent ce que le corps ne dit pas (version du projet).
export function postPreparedImageResponse<T>(
  upload: PreparedImageUpload,
): Observable<HttpResponse<T>> {
  return upload.prepare(upload.file).pipe(
    switchMap((prepared) =>
      upload.http.post<T>(upload.url, formOf(prepared, upload.fields), {
        context: upload.context,
        observe: 'response',
        ...(upload.headers ? { headers: upload.headers } : {}),
      }),
    ),
  );
}

function formOf(file: File, fields: Readonly<Record<string, string>> = {}): FormData {
  const formData = new FormData();
  formData.append('file', file);
  for (const [name, value] of Object.entries(fields)) formData.append(name, value);
  return formData;
}
