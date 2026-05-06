import { Injectable, inject } from '@angular/core';

import { AddTeamMemberRequest, ApiResponse, PageResponse, TeamCreateRequest, TeamMemberResponse, TeamResponse } from '../models/api.models';
import { ApiClientService } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = inject(ApiClientService);

  list(params?: { page?: number; size?: number; sort?: string }) {
    return this.api.get<ApiResponse<PageResponse<TeamResponse>>>('/teams', params);
  }

  getCompanyTeams(params?: { page?: number; size?: number; sort?: string }) {
    return this.list(params);
  }

  get(id: number) {
    return this.api.get<ApiResponse<TeamResponse>>(`/teams/${id}`);
  }

  create(payload: TeamCreateRequest) {
    return this.api.post<ApiResponse<TeamResponse>>('/teams', payload);
  }

  update(id: number, payload: Partial<TeamResponse>) {
    return this.api.put<ApiResponse<TeamResponse>>(`/teams/${id}`, payload);
  }

  remove(id: number) {
    return this.api.delete<ApiResponse<void>>(`/teams/${id}`);
  }

  addMember(teamId: number, payload: AddTeamMemberRequest) {
    return this.api.post<ApiResponse<TeamMemberResponse>>(`/teams/${teamId}/members`, payload);
  }

  removeMember(teamId: number, memberId: number) {
    return this.api.delete<ApiResponse<void>>(`/teams/${teamId}/members/${memberId}`);
  }
}
