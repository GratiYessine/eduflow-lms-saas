import { Injectable, inject } from '@angular/core';

import { ApiResponse, QuizAttemptResponse, QuizCreateRequest, QuizResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly api = inject(ApiClientService);

  create(lessonId: number, payload: QuizCreateRequest) {
    return this.api.post<ApiResponse<QuizResponse>>(`/lessons/${lessonId}/quiz`, payload);
  }

  getByLesson(lessonId: number) {
    return this.api.get<ApiResponse<QuizResponse>>(`/lessons/${lessonId}/quiz`);
  }

  update(quizId: number, payload: QuizCreateRequest) {
    return this.api.put<ApiResponse<QuizResponse>>(`/quizzes/${quizId}`, payload);
  }

  publish(quizId: number) {
    return this.api.patch<ApiResponse<QuizResponse>>(`/quizzes/${quizId}/publish`);
  }

  unpublish(quizId: number) {
    return this.api.patch<ApiResponse<QuizResponse>>(`/quizzes/${quizId}/unpublish`);
  }

  remove(quizId: number) {
    return this.api.delete<ApiResponse<void>>(`/quizzes/${quizId}`);
  }

  submit(quizId: number, payload: { answers: Array<{ questionId: number; selectedOptionIds: number[] }> }) {
    return this.api.post<ApiResponse<QuizAttemptResponse>>(`/quizzes/${quizId}/submit`, payload);
  }
}
