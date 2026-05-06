import { Injectable, inject } from '@angular/core';

import { ApiResponse, CompanyResponse, PageResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiClientService);

  me() {
    return this.api.get<ApiResponse<CompanyResponse>>('/companies/me');
  }

  list(params?: { page?: number; size?: number; sort?: string; q?: string }) {
    return this.api.get<ApiResponse<PageResponse<CompanyResponse>>>('/companies', params);
  }

  create(payload: Partial<CompanyResponse>) {
    return this.api.post<ApiResponse<CompanyResponse>>('/companies', payload);
  }

  update(id: number, payload: Partial<CompanyResponse>) {
    return this.api.put<ApiResponse<CompanyResponse>>(`/companies/${id}`, payload);
  }
}
