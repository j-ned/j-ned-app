import { HttpErrorResponse } from '@angular/common/http';

export function apiRejection(
  status: number,
  message?: string | readonly string[],
): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    url: '/api/resource',
    error:
      message === undefined
        ? null
        : {
            statusCode: status,
            error: status === 400 ? 'Bad Request' : 'Error',
            message,
            path: '/api/resource',
            timestamp: '2026-10-08T09:00:00.000Z',
          },
  });
}
