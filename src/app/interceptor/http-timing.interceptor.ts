import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

export const httpTimingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = performance.now();

  return next(req).pipe(
    finalize(() => {
      const elapsed = (performance.now() - startTime).toFixed(2);
      console.log(`[HTTP ${req.method}] ${req.urlWithParams} ${elapsed} ms`);
    })
  );
};

