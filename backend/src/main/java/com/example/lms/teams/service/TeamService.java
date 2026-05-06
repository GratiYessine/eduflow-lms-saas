package com.example.lms.teams.service;

import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.security.SecurityUtils;
import com.example.lms.teams.dto.AddTeamMemberRequest;
import com.example.lms.teams.dto.TeamCreateRequest;
import com.example.lms.teams.dto.TeamMemberResponse;
import com.example.lms.teams.dto.TeamResponse;
import com.example.lms.teams.dto.TeamUpdateRequest;
import com.example.lms.teams.entity.Team;
import com.example.lms.teams.entity.TeamMember;
import com.example.lms.teams.mapper.TeamMapper;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.teams.repository.TeamRepository;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TrainingAssignmentRepository assignmentRepository;
    private final TrainingRepository trainingRepository;
    private final UserRepository userRepository;
    private final TeamMapper teamMapper;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final InvitationService invitationService;
    private final SecureTokenService secureTokenService;
    private final StringSanitizer sanitizer;

    @Transactional
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN','SUPER_ADMIN')")
    public TeamResponse create(TeamCreateRequest request) {
        Long companyId = requireCompany();
        String name = sanitizer.clean(request.name());
        if (teamRepository.existsByCompanyIdAndNameIgnoreCase(companyId, name)) {
            throw new DuplicateResourceException("Team name is already used in this company");
        }
        Team team = new Team();
        team.setCompanyId(companyId);
        team.setName(name);
        team.setDescription(sanitizer.clean(request.description()));
        team.setManagerId(request.managerId());
        validateManager(companyId, request.managerId());
        return teamMapper.toResponse(teamRepository.save(team));
    }

    @Transactional(readOnly = true)
    public PageResponse<TeamResponse> list(Pageable pageable) {
        if (SecurityUtils.currentRole() == Role.SUPER_ADMIN && SecurityUtils.currentCompanyId() == null) {
            return PageResponse.from(teamRepository.findAll(pageable).map(teamMapper::toResponse));
        }
        Long companyId = requireCompany();
        return PageResponse.from(teamRepository.findByCompanyId(companyId, pageable).map(teamMapper::toResponse));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN') or @tenantSecurity.isTeamManager(#id) or @tenantSecurity.isMemberOfTeam(#id)")
    public TeamResponse get(Long id) {
        Team team = teamInTenant(id);
        return toTeamResponse(team, true);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN') or @tenantSecurity.isTeamManager(#id)")
    public TeamResponse update(Long id, TeamUpdateRequest request) {
        Team team = teamInTenant(id);
        String name = sanitizer.clean(request.name());
        if (name != null && !name.isBlank() && !name.equalsIgnoreCase(team.getName())) {
            if (teamRepository.existsByCompanyIdAndNameIgnoreCase(team.getCompanyId(), name)) {
                throw new DuplicateResourceException("Team name is already used in this company");
            }
            team.setName(name);
        }
        team.setDescription(sanitizer.clean(request.description()));
        validateManager(team.getCompanyId(), request.managerId());
        team.setManagerId(request.managerId());
        return teamMapper.toResponse(team);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN') or @tenantSecurity.isTeamManager(#id)")
    public void delete(Long id) {
        Team team = teamInTenant(id);
        teamRepository.delete(team);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN') or @tenantSecurity.isTeamManager(#teamId)")
    public TeamMemberResponse addMember(Long teamId, AddTeamMemberRequest request) {
        Team team = teamInTenant(teamId);
        if (request.role() != Role.LEARNER && request.role() != Role.TEAM_MANAGER) {
            throw new BadRequestException("Team members can only be LEARNER or TEAM_MANAGER");
        }
        User user = userRepository.findByEmailIgnoreCase(sanitizer.email(request.email()))
                .map(existing -> attachExistingUser(existing, team.getCompanyId(), request.role()))
                .orElseGet(() -> inviteUser(request, team.getCompanyId()));
        boolean needsInvitationEmail = user.getStatus() != UserStatus.ACTIVE;
        if (teamMemberRepository.existsByTeamIdAndUserIdAndCompanyId(teamId, user.getId(), team.getCompanyId())) {
            throw new DuplicateResourceException("User is already a member of this team");
        }
        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setCompanyId(team.getCompanyId());
        member.setUserId(user.getId());
        member.setPosition(sanitizer.clean(request.position()));
        if (request.role() == Role.TEAM_MANAGER && team.getManagerId() == null) {
            team.setManagerId(user.getId());
        }
        notificationService.notify(user.getId(), "Team invitation", "You were added to team " + team.getName(), NotificationType.MEMBER_INVITED);
        TeamMember saved = teamMemberRepository.save(member);
        if (needsInvitationEmail) {
            invitationService.sendInvitation(user, team, SecurityUtils.currentUserId());
        }
        notifyExistingTeamAssignments(user.getId(), team);
        return toTeamMemberResponse(saved, user);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN') or @tenantSecurity.isTeamManager(#teamId)")
    public void removeMember(Long teamId, Long memberId) {
        Team team = teamInTenant(teamId);
        TeamMember member = teamMemberRepository.findByIdAndTeamIdAndCompanyId(memberId, teamId, team.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));
        teamMemberRepository.delete(member);
    }

    private Team teamInTenant(Long id) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        Long companyId = SecurityUtils.currentCompanyId();
        Role role = SecurityUtils.currentRole();
        if (role != Role.SUPER_ADMIN && (companyId == null || !companyId.equals(team.getCompanyId()))) {
            throw new ForbiddenException("Team belongs to another company");
        }
        return team;
    }

    private Long requireCompany() {
        Long companyId = SecurityUtils.currentCompanyId();
        if (companyId == null) {
            throw new BadRequestException("Company context is required");
        }
        return companyId;
    }

    private void validateManager(Long companyId, Long managerId) {
        if (managerId == null) {
            return;
        }
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        if (!companyId.equals(manager.getCompanyId()) || manager.getRole() != Role.TEAM_MANAGER) {
            throw new BadRequestException("Manager must be a TEAM_MANAGER in the same company");
        }
    }

    private User attachExistingUser(User user, Long companyId, Role role) {
        if (user.getCompanyId() != null && !companyId.equals(user.getCompanyId())) {
            throw new BadRequestException("Email already belongs to another company");
        }
        user.setCompanyId(companyId);
        user.setRole(role);
        return user;
    }

    private User inviteUser(AddTeamMemberRequest request, Long companyId) {
        User user = new User();
        user.setEmail(sanitizer.email(request.email()));
        user.setFirstName(sanitizer.clean(request.firstName()));
        user.setLastName(sanitizer.clean(request.lastName()));
        user.setRole(request.role());
        user.setCompanyId(companyId);
        user.setStatus(UserStatus.PENDING);
        user.setPassword(passwordEncoder.encode(secureTokenService.randomToken()));
        return userRepository.save(user);
    }

    private void notifyExistingTeamAssignments(Long userId, Team team) {
        assignmentRepository.findByCompanyIdAndTeamIdInAndLearnerIdIsNullAndStatus(
                        team.getCompanyId(), List.of(team.getId()), AssignmentStatus.ACTIVE)
                .forEach(assignment -> {
                    String title = trainingRepository.findById(assignment.getTrainingId())
                            .map(training -> training.getTitle())
                            .orElse("A training");
                    notificationService.notify(userId, "Training assigned",
                            title + " is already assigned to team " + team.getName(),
                            NotificationType.TRAINING_ASSIGNED);
                });
    }

    private TeamResponse toTeamResponse(Team team, boolean includeMembers) {
        List<TeamMemberResponse> members = includeMembers
                ? loadMembers(team.getId(), team.getCompanyId())
                : List.of();
        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getCompanyId(),
                team.getManagerId(),
                team.getDescription(),
                team.getCreatedAt(),
                members
        );
    }

    private List<TeamMemberResponse> loadMembers(Long teamId, Long companyId) {
        List<TeamMember> members = teamMemberRepository.findByTeamIdAndCompanyId(teamId, companyId);
        Map<Long, User> usersById = userRepository.findAllById(members.stream().map(TeamMember::getUserId).toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return members.stream()
                .map(member -> toTeamMemberResponse(member, usersById.get(member.getUserId())))
                .toList();
    }

    private TeamMemberResponse toTeamMemberResponse(TeamMember member, User user) {
        return new TeamMemberResponse(
                member.getId(),
                member.getUserId(),
                member.getTeamId(),
                member.getCompanyId(),
                member.getPosition(),
                member.getJoinedAt(),
                user != null ? user.getFirstName() : null,
                user != null ? user.getLastName() : null,
                user != null ? user.getEmail() : null,
                user != null ? user.getRole() : null,
                user != null ? user.getStatus() : null
        );
    }
}
