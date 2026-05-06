import { Injectable, inject } from '@angular/core';

import { ApiResponse, TrainerApplicationResponse, TrainerApprovalResponse, TrainerLearnerResponse, TrainerProfileResponse, TrainerVerificationStatus, TrainerWalletResponse, UpdateTrainerProfileRequest } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class TrainerService {
  private readonly api = inject(ApiClientService);

  get(id: number) {
    return this.api.get<ApiResponse<TrainerProfileResponse>>(`/trainers/${id}`);
  }

  updateProfile(payload: UpdateTrainerProfileRequest) {
    return this.api.put<ApiResponse<TrainerProfileResponse>>('/trainers/profile', payload);
  }

  learners() {
    return this.api.get<ApiResponse<TrainerLearnerResponse[]>>('/trainers/me/learners');
  }

  approvals() {
    return this.api.get<ApiResponse<TrainerApprovalResponse[]>>('/trainers/me/approvals');
  }

  wallet() {
    return this.api.get<ApiResponse<TrainerWalletResponse>>('/trainers/me/wallet');
  }

  pendingApplications() {
    return this.api.get<ApiResponse<TrainerApplicationResponse[]>>('/admin/trainers/pending');
  }

  applications(status?: TrainerVerificationStatus) {
    const query = status ? `?status=${status}` : '';
    return this.api.get<ApiResponse<TrainerApplicationResponse[]>>(`/admin/trainers/applications${query}`);
  }

  approveApplication(trainerId: number) {
    return this.api.patch<ApiResponse<TrainerApplicationResponse>>(`/admin/trainers/${trainerId}/approve`);
  }

  rejectApplication(trainerId: number, reason: string) {
    return this.api.patch<ApiResponse<TrainerApplicationResponse>>(`/admin/trainers/${trainerId}/reject`, { reason });
  }
}
