import { Injectable, inject } from '@angular/core';

import { ApiResponse, ProgressResponse, QuizAttemptResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly api = inject(ApiClientService);

  my() {
    return this.api.get<ApiResponse<ProgressResponse[]>>('/progress/my');
  }

  completeLesson(id: number) {
    return this.api.post<ApiResponse<ProgressResponse>>(`/lessons/${id}/complete`, {});
  }

  submitQuiz(quizId: number, payload: { answers: Array<{ questionId: number; selectedOptionIds: number[] }> }) {
    return this.api.post<ApiResponse<QuizAttemptResponse>>(`/quizzes/${quizId}/submit`, payload);
  }

  approve(id: number) {
    return this.api.patch<ApiResponse<ProgressResponse>>(`/progress/${id}/approve`);
  }

  reject(id: number) {
    return this.api.patch<ApiResponse<ProgressResponse>>(`/progress/${id}/reject`);
  }
}
