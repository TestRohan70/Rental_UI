import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Skip-Loader')) {
    return next(req);
  }

  const loader = inject(LoaderService);
  loader.showRequest();

  return next(req).pipe(
    finalize(() => loader.hideRequest())
  );
};
