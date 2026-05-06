import { HttpClient } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse } from '../models/api.models';
import { TokenStorageService } from './token-storage.service';

let refreshRequest$: Observable<ApiResponse<AuthResponse>> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokens = inject(TokenStorageService);
  const http = inject(HttpClient);
  const router = inject(Router);
  const token = tokens.accessToken;

  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error) => {
      const refreshToken = tokens.refreshToken;
      const isRefreshRequest = request.url.includes('/auth/refresh-token');
      const isLoginRequest = request.url.includes('/auth/login');
      const isLogoutRequest = request.url.includes('/auth/logout');

      if (error.status === 401 && refreshToken && !isRefreshRequest && !isLoginRequest && !isLogoutRequest) {
        refreshRequest$ ??= http
          .post<ApiResponse<AuthResponse>>(`${environment.apiBaseUrl}/auth/refresh-token`, { refreshToken })
          .pipe(
            shareReplay(1),
            finalize(() => {
              refreshRequest$ = null;
            })
          );

        return refreshRequest$.pipe(
          switchMap((response) => {
            tokens.save(response.data?.accessToken, response.data?.refreshToken);
            const nextToken = response.data?.accessToken;
            const retryRequest = nextToken
              ? request.clone({ setHeaders: { Authorization: `Bearer ${nextToken}` } })
              : request;
            return next(retryRequest);
          }),
          catchError((refreshError) => {
            tokens.clear();
            void router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 401 && !isLoginRequest) {
        tokens.clear();
        void router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
