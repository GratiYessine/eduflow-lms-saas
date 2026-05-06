import { Injectable, inject } from '@angular/core';

import { ApiResponse, NotificationResponse, PageResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiClientService);

  list(params?: { page?: number; size?: number; sort?: string }) {
    return this.api.get<ApiResponse<PageResponse<NotificationResponse>>>('/notifications', params);
  }

  markRead(id: number) {
    return this.api.patch<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`);
  }

  markAllRead() {
    return this.api.patch<ApiResponse<void>>('/notifications/read-all');
  }
}
