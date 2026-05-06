import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessTokenKey = 'eduflow_access_token';
  private readonly refreshTokenKey = 'eduflow_refresh_token';

  get accessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  save(accessToken?: string | null, refreshToken?: string | null): void {
    if (accessToken) {
      localStorage.setItem(this.accessTokenKey, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
  }

  clear(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}
