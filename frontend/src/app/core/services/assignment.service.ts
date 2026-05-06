import { Injectable, inject } from '@angular/core';

import { ApiResponse, AssignmentCreateRequest, AssignmentResponse, BulkAssignmentCreateRequest } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly api = inject(ApiClientService);

  create(payload: AssignmentCreateRequest) {
    return this.api.post<ApiResponse<AssignmentResponse>>('/assignments', payload);
  }

  createBulk(payload: BulkAssignmentCreateRequest) {
    return this.api.post<ApiResponse<AssignmentResponse[]>>('/assignments/bulk', payload);
  }

  my() {
    return this.api.get<ApiResponse<AssignmentResponse[]>>('/assignments/my');
  }
}
