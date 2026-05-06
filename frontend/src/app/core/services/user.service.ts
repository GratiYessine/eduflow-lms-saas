import { Injectable, inject } from '@angular/core';

import { ApiResponse, CreateUserRequest, PageResponse, Role, UserResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiClientService);

  me() {
    return this.api.get<ApiResponse<UserResponse>>('/users/me');
  }

  list(params?: { page?: number; size?: number; sort?: string; q?: string; role?: Role; companyId?: number }) {
    return this.api.get<ApiResponse<PageResponse<UserResponse>>>('/users', params);
  }

  getCompanyMembers(params?: { page?: number; size?: number; sort?: string; q?: string; role?: Role; companyId?: number }) {
    return this.list(params);
  }

  updateMe(payload: Partial<UserResponse>) {
    return this.api.put<ApiResponse<UserResponse>>('/users/me', payload);
  }

  sendChangePasswordCode() {
    return this.api.post<ApiResponse<void>>('/users/change-password/code', {});
  }

  changePassword(payload: { currentPassword: string; code: string; newPassword: string }) {
    return this.api.put<ApiResponse<void>>('/users/change-password', payload);
  }

  create(payload: CreateUserRequest) {
    return this.api.post<ApiResponse<UserResponse>>('/users', payload);
  }
}
