import { Injectable, inject } from '@angular/core';

import { ApiResponse, LessonCreateRequest, LessonResourceResponse, LessonResponse, LessonUpdateRequest, ProgressResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';
import { Observable, catchError, map } from 'rxjs';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface LessonResourceUploadState {
  progress: number;
  resource?: LessonResourceResponse;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);

  create(trainingId: number, payload: LessonCreateRequest) {
    return this.api.post<ApiResponse<LessonResponse>>(`/trainings/${trainingId}/lessons`, payload);
  }

  listByTraining(trainingId: number) {
    return this.api.get<ApiResponse<LessonResponse[]>>(`/trainings/${trainingId}/lessons`);
  }

  update(id: number, payload: LessonUpdateRequest) {
    return this.api.put<ApiResponse<LessonResponse>>(`/lessons/${id}`, payload);
  }

  remove(id: number) {
    return this.api.delete<ApiResponse<void>>(`/lessons/${id}`);
  }

  complete(id: number) {
    return this.api.post<ApiResponse<ProgressResponse>>(`/lessons/${id}/complete`, {});
  }

  resources(lessonId: number) {
    return this.api.get<ApiResponse<LessonResourceResponse[]>>(`/lessons/${lessonId}/resources`);
  }

  uploadResource(lessonId: number, file: File): Observable<LessonResourceUploadState> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<LessonResourceResponse>>(`${environment.apiBaseUrl}/lessons/${lessonId}/resources`, form, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<ApiResponse<LessonResourceResponse>>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? file.size;
          return { progress: total ? Math.round((event.loaded / total) * 100) : 0 };
        }
        if (event.type === HttpEventType.Response) {
          return { progress: 100, resource: event.body?.data };
        }
        return { progress: 0 };
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  deleteResource(id: number) {
    return this.api.delete<ApiResponse<void>>(`/lesson-resources/${id}`);
  }
}
