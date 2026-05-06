package com.example.lms.teams.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.teams.dto.AddTeamMemberRequest;
import com.example.lms.teams.dto.TeamCreateRequest;
import com.example.lms.teams.dto.TeamMemberResponse;
import com.example.lms.teams.dto.TeamResponse;
import com.example.lms.teams.dto.TeamUpdateRequest;
import com.example.lms.teams.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ApiResponse<TeamResponse> create(@Valid @RequestBody TeamCreateRequest request) {
        return ApiResponse.success("Team created successfully", teamService.create(request));
    }

    @GetMapping
    public ApiResponse<PageResponse<TeamResponse>> list(Pageable pageable) {
        return ApiResponse.success("Teams loaded successfully", teamService.list(pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<TeamResponse> get(@PathVariable Long id) {
        return ApiResponse.success("Team loaded successfully", teamService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TeamResponse> update(@PathVariable Long id, @Valid @RequestBody TeamUpdateRequest request) {
        return ApiResponse.success("Team updated successfully", teamService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        teamService.delete(id);
        return ApiResponse.success("Team deleted successfully");
    }

    @PostMapping("/{id}/members")
    public ApiResponse<TeamMemberResponse> addMember(@PathVariable Long id, @Valid @RequestBody AddTeamMemberRequest request) {
        return ApiResponse.success("Team member added successfully", teamService.addMember(id, request));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ApiResponse<Void> removeMember(@PathVariable Long id, @PathVariable Long memberId) {
        teamService.removeMember(id, memberId);
        return ApiResponse.success("Team member removed successfully");
    }
}
