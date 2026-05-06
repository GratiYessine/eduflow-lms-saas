import { HttpErrorResponse } from '@angular/common/http';

import { ApiResponse } from '../models/api.models';

export interface ApiErrorInfo {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
}

export function parseApiError(error: unknown): ApiErrorInfo {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiResponse<unknown>> | undefined;
    if (body && typeof body === 'object') {
      return {
        message: body.message || fallbackMessage(error.status),
        fieldErrors: body.errors ?? {},
        status: error.status
      };
    }
    return { message: fallbackMessage(error.status), fieldErrors: {}, status: error.status };
  }

  return { message: 'Unexpected error. Please try again.', fieldErrors: {} };
}

export function controlError(fieldErrors: Record<string, string>, field: string): string {
  return fieldErrors[field] ?? '';
}

function fallbackMessage(status: number): string {
  if (status === 0) {
    return 'Backend is unreachable. Check that the API is running.';
  }
  if (status === 400) {
    return 'Please review the submitted information.';
  }
  if (status === 401) {
    return 'Your session has expired. Please login again.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  if (status === 409) {
    return 'This resource already exists or conflicts with existing data.';
  }
  return 'Unexpected server error. Please try again.';
}
