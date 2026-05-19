import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

/**
 * CRUD HTTP methods factory.
 *
 * Returns a uniform set of methods (`getById`, `create`, `update`, `delete`)
 * targeting REST endpoints shaped as:
 * - `GET    {baseUrl}{endpoint}/{id}`
 * - `POST   {baseUrl}{endpoint}`
 * - `PATCH  {baseUrl}{endpoint}/{id}`
 * - `DELETE {baseUrl}{endpoint}/{id}`
 *
 * Pure function, no Angular DI: pass `HttpClient` explicitly.
 */
export function createCrudHttpMethods<T extends { id: string }>(
  http: HttpClient,
  baseUrl: string,
  endpoint: string,
): {
  getById: (id: string) => Observable<T>;
  create: (data: Omit<T, 'id'>) => Observable<T>;
  update: (id: string, data: Partial<T>) => Observable<T>;
  delete: (id: string) => Observable<void>;
} {
  const collectionUrl = `${baseUrl}${endpoint}`;
  const itemUrl = (id: string): string => `${collectionUrl}/${id}`;

  return {
    getById: (id) => http.get<T>(itemUrl(id)),
    create: (data) => http.post<T>(collectionUrl, data),
    update: (id, data) => http.patch<T>(itemUrl(id), data),
    delete: (id) => http.delete<void>(itemUrl(id)),
  };
}
