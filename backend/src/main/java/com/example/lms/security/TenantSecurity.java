package com.example.lms.security;

import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.teams.repository.TeamRepository;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("tenantSecurity")
@RequiredArgsConstructor
public class TenantSecurity {

    private final TrainingRepository trainingRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public boolean hasCompanyAccess(Long companyId) {
        UserPrincipal current = SecurityUtils.currentUser();
        if (current == null) {
            return false;
        }
        if (current.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        return companyId != null && companyId.equals(current.getCompanyId());
    }

    public boolean isTrainingOwner(Long trainingId) {
        UserPrincipal current = SecurityUtils.currentUser();
        if (current == null) {
            return false;
        }
        if (current.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        return trainingRepository.existsByIdAndTrainerId(trainingId, current.getId());
    }

    public boolean isTeamManager(Long teamId) {
        UserPrincipal current = SecurityUtils.currentUser();
        if (current == null) {
            return false;
        }
        if (current.getRole() == Role.SUPER_ADMIN || current.getRole() == Role.COMPANY_ADMIN) {
            return teamRepository.findById(teamId)
                    .map(team -> hasCompanyAccess(team.getCompanyId()))
                    .orElse(false);
        }
        return teamRepository.existsByIdAndManagerIdAndCompanyId(teamId, current.getId(), current.getCompanyId());
    }

    public boolean isMemberOfTeam(Long teamId) {
        Long userId = SecurityUtils.currentUserId();
        Long companyId = SecurityUtils.currentCompanyId();
        return userId != null && companyId != null && teamMemberRepository.existsByTeamIdAndUserIdAndCompanyId(teamId, userId, companyId);
    }
}
