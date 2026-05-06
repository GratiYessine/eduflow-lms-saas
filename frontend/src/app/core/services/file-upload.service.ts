import { HttpClient, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { filter, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, FileCategory, FileResponse } from '../models/api.models';

export interface UploadState {
  progress: number;
  file?: FileResponse;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private readonly http = inject(HttpClient);
  private readonly maxBytes = 20 * 1024 * 1024;

  upload(file: File, category: FileCategory) {
    this.validate(file, category);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.http
      .post<ApiResponse<FileResponse>>(`${environment.apiBaseUrl}/files/upload`, formData, {
        observe: 'events',
        reportProgress: true
      })
      .pipe(
        filter((event) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
        map((event: HttpEvent<ApiResponse<FileResponse>>): UploadState => {
          if (event.type === HttpEventType.UploadProgress) {
            return { progress: Math.round((event.loaded / (event.total || event.loaded)) * 100) };
          }
          const response = event as HttpResponse<ApiResponse<FileResponse>>;
          return { progress: 100, file: response.body?.data };
        })
      );
  }

  private validate(file: File, category: FileCategory): void {
    if (file.size > this.maxBytes) {
      throw new Error('File must be 20MB or smaller.');
    }

    const imageCategories: FileCategory[] = ['AVATAR', 'COMPANY_LOGO', 'TRAINING_THUMBNAIL'];
    if (imageCategories.includes(category) && !file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed here.');
    }

    if (category === 'VIDEO' && !file.type.startsWith('video/')) {
      throw new Error('Only video files are allowed here.');
    }
  }
}
