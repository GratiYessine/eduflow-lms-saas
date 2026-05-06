import { Injectable, inject } from '@angular/core';

import { ApiResponse, PageResponse, TrainerLearnerResponse, TrainingCreateRequest, TrainingResponse, TrainingUpdateRequest } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly api = inject(ApiClientService);

  list(params?: { page?: number; size?: number; sort?: string; q?: string; category?: string; level?: string; status?: string; trainerId?: number }) {
    return this.api.get<ApiResponse<PageResponse<TrainingResponse>>>('/trainings', params);
  }

  getPublishedTrainings(params?: { page?: number; size?: number; sort?: string; q?: string; category?: string; level?: string; trainerId?: number }) {
    return this.list({ ...params, status: 'PUBLISHED' });
  }

  searchTrainings(params?: { page?: number; size?: number; sort?: string; q?: string; category?: string; level?: string; status?: string; trainerId?: number }) {
    return this.list(params);
  }

  get(id: number) {
    return this.api.get<ApiResponse<TrainingResponse>>(`/trainings/${id}`);
  }

  learners(id: number) {
    return this.api.get<ApiResponse<TrainerLearnerResponse[]>>(`/trainings/${id}/learners`);
  }

  create(payload: TrainingCreateRequest) {
    return this.api.post<ApiResponse<TrainingResponse>>('/trainings', payload);
  }

  update(id: number, payload: TrainingUpdateRequest) {
    return this.api.put<ApiResponse<TrainingResponse>>(`/trainings/${id}`, payload);
  }

  publish(id: number) {
    return this.api.patch<ApiResponse<TrainingResponse>>(`/trainings/${id}/publish`);
  }

  archive(id: number) {
    return this.api.patch<ApiResponse<TrainingResponse>>(`/trainings/${id}/archive`);
  }

  remove(id: number) {
    return this.api.delete<ApiResponse<void>>(`/trainings/${id}`);
  }
}
