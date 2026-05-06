import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, tap, throwError } from 'rxjs';

import { ApiResponse, AuthResponse, LoginRequest, RegisterCompanyRequest, Role, TrainerApplicationResponse, UserResponse } from '../models/api.models';
import { ApiClientService } from '../services/api-client.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);
  private readonly tokens = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly currentUser = signal<UserResponse | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokens.accessToken);
  readonly isLoadingUser = signal(false);

  login(payload: LoginRequest) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/login', payload).pipe(tap((res) => this.setSession(res.data)));
  }

  registerCompany(payload: RegisterCompanyRequest) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/register', payload).pipe(tap((res) => this.setSession(res.data)));
  }

  registerTrainer(payload: FormData) {
    return this.api.post<ApiResponse<TrainerApplicationResponse>>('/auth/register-trainer', payload);
  }

  forgotPassword(email: string) {
    return this.api.post<ApiResponse<void>>('/auth/forgot-password', { email });
  }

  resetPassword(email: string, code: string, password: string) {
    return this.api.post<ApiResponse<void>>('/auth/reset-password', { email, code, newPassword: password });
  }

  verifyEmail(token: string) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/verify-email', { token }).pipe(tap((res) => this.setSession(res.data)));
  }

  acceptInvitation(token: string, password: string) {
    return this.api.post<ApiResponse<AuthResponse>>('/auth/accept-invitation', { token, password }).pipe(tap((res) => this.setSession(res.data)));
  }

  me() {
    return this.api.get<ApiResponse<UserResponse>>('/auth/me').pipe(
      map((res) => res.data!),
      tap((user) => this.currentUser.set(user))
    );
  }

  ensureCurrentUser() {
    if (this.currentUser()) {
      return of(this.currentUser()!);
    }
    if (!this.tokens.accessToken) {
      return throwError(() => new Error('No access token'));
    }
    this.isLoadingUser.set(true);
    return this.me().pipe(finalize(() => this.isLoadingUser.set(false)));
  }

  hasRole(roles: Role[]): boolean {
    const role = this.currentUser()?.role;
    return !!role && roles.includes(role);
  }

  logout(): void {
    const refreshToken = this.tokens.refreshToken;
    if (refreshToken) {
      this.api
        .post<ApiResponse<void>>('/auth/logout', { refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe(() => this.clearLocalSession());
      return;
    }
    this.clearLocalSession();
  }

  private clearLocalSession(): void {
    this.tokens.clear();
    this.currentUser.set(null);
    void this.router.navigate(['/auth/login']);
  }

  handleUnauthorized(): void {
    this.logout();
  }

  private setSession(response?: AuthResponse | null): void {
    if (!response) {
      return;
    }
    this.tokens.save(response.accessToken, response.refreshToken);
    this.currentUser.set(response.user);
  }
}
