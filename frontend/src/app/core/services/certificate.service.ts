import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ApiResponse, CertificateResponse, CertificateVerificationResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);

  my() {
    return this.api.get<ApiResponse<CertificateResponse[]>>('/certificates/my');
  }

  generate(progressId: number) {
    return this.api.post<ApiResponse<CertificateResponse>>(`/certificates/generate/${progressId}`, {});
  }

  verify(code: string) {
    return this.api.get<ApiResponse<CertificateVerificationResponse>>(`/certificates/verify/${code}`);
  }

  download(id: number) {
    return this.http.get(`${environment.apiBaseUrl}/certificates/${id}/download`, {
      responseType: 'blob'
    });
  }
}
