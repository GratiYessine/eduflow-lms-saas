package com.example.lms.assignments.service;

import com.example.lms.assignments.dto.AssignmentRequest;
import com.example.lms.assignments.dto.AssignmentResponse;
import com.example.lms.assignments.dto.AssignmentTargetType;
import com.example.lms.assignments.dto.BulkAssignmentRequest;
import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.entity.TrainingAssignment;
import com.example.lms.assignments.mapper.AssignmentMapper;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.security.SecurityUtils;
import com.example.lms.teams.entity.Team;
import com.example.lms.teams.entity.TeamMember;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.teams.repository.TeamRepository;
import com.example.lms.trainings.entity.Training;
import com.example.lms.trainings.entity.TrainingStatus;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final TrainingAssignmentRepository assignmentRepository;
    private final TrainingRepository trainingRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final AssignmentMapper assignmentMapper;
    private final NotificationService notificationService;

    @Transactional
    public AssignmentResponse assign(AssignmentRequest request) {
        Long companyId = resolveCompany(request);
        Training training = trainingRepository.findById(request.trainingId())
                .orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        if (training.getStatus() != TrainingStatus.PUBLISHED) {
            throw new BadRequestException("Only published trainings can be assigned");
        }
        validateScope(companyId, request.teamId(), request.learnerId());
        ensureNotDuplicate(request.trainingId(), companyId, request.teamId(), request.learnerId());

        TrainingAssignment assignment = new TrainingAssignment();
        assignment.setTrainingId(request.trainingId());
        assignment.setCompanyId(companyId);
        assignment.setTeamId(request.teamId());
        assignment.setLearnerId(request.learnerId());
        assignment.setDueDate(request.dueDate());
        assignment.setAssignedBy(SecurityUtils.currentUserId());
        assignment = assignmentRepository.save(assignment);
        notifyTargets(assignment, training);
        return assignmentMapper.toResponse(assignment);
    }

    @Transactional
    public List<AssignmentResponse> assignBulk(BulkAssignmentRequest request) {
        if (request.targetType() == null) {
            throw new BadRequestException("Assignment target type is required");
        }
        List<AssignmentRequest> requests = switch (request.targetType()) {
            case COMPANY -> List.of(new AssignmentRequest(
                    request.trainingId(),
                    request.companyId(),
                    null,
                    null,
                    request.dueDate()
            ));
            case TEAM -> normalizedTargets(request.teamIds(), "Choose at least one team").stream()
                    .map(teamId -> new AssignmentRequest(
                            request.trainingId(),
                            request.companyId(),
                            teamId,
                            null,
                            request.dueDate()
                    ))
                    .toList();
            case LEARNER -> normalizedTargets(request.learnerIds(), "Choose at least one learner").stream()
                    .map(learnerId -> new AssignmentRequest(
                            request.trainingId(),
                            request.companyId(),
                            null,
                            learnerId,
                            request.dueDate()
                    ))
                    .toList();
        };
        return requests.stream().map(this::assign).toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentResponse> myAssignments() {
        Long userId = SecurityUtils.currentUserId();
        Long companyId = SecurityUtils.currentCompanyId();
        if (userId == null || companyId == null) {
            return List.of();
        }
        Role role = SecurityUtils.currentRole();
        if (role == Role.COMPANY_ADMIN) {
            return assignmentRepository.findByCompanyIdAndStatus(companyId, AssignmentStatus.ACTIVE)
                    .stream()
                    .map(assignmentMapper::toResponse)
                    .toList();
        }
        List<TeamMember> memberships = teamMemberRepository.findByUserIdAndCompanyId(userId, companyId);
        List<Long> teamIds = new ArrayList<>(memberships.stream().map(TeamMember::getTeamId).toList());
        if (role == Role.TEAM_MANAGER) {
            teamRepository.findByManagerIdAndCompanyId(userId, companyId)
                    .stream()
                    .map(Team::getId)
                    .filter(teamId -> !teamIds.contains(teamId))
                    .forEach(teamIds::add);
        }
        List<TrainingAssignment> assignments = new ArrayList<>();
        assignments.addAll(assignmentRepository.findByCompanyIdAndLearnerIdAndStatus(companyId, userId, AssignmentStatus.ACTIVE));
        if (!teamIds.isEmpty()) {
            assignments.addAll(assignmentRepository.findByCompanyIdAndTeamIdInAndLearnerIdIsNullAndStatus(companyId, teamIds, AssignmentStatus.ACTIVE));
        }
        assignments.addAll(assignmentRepository.findByCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(companyId, AssignmentStatus.ACTIVE));
        return assignments.stream().map(assignmentMapper::toResponse).toList();
    }

    private Long resolveCompany(AssignmentRequest request) {
        Role role = SecurityUtils.currentRole();
        Long currentCompanyId = SecurityUtils.currentCompanyId();
        if (role == Role.SUPER_ADMIN) {
            if (request.companyId() == null) {
                throw new BadRequestException("companyId is required for SUPER_ADMIN assignments");
            }
            return request.companyId();
        }
        if (currentCompanyId == null) {
            throw new BadRequestException("Company context is required");
        }
        if (request.companyId() != null && !currentCompanyId.equals(request.companyId())) {
            throw new ForbiddenException("Cannot assign training for another company");
        }
        if (role == Role.TEAM_MANAGER && request.teamId() == null) {
            throw new ForbiddenException("TEAM_MANAGER assignments must target a managed team");
        }
        return currentCompanyId;
    }

    private void validateScope(Long companyId, Long teamId, Long learnerId) {
        if (teamId != null) {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
            if (!companyId.equals(team.getCompanyId())) {
                throw new ForbiddenException("Team belongs to another company");
            }
            if (SecurityUtils.currentRole() == Role.TEAM_MANAGER && !SecurityUtils.currentUserId().equals(team.getManagerId())) {
                throw new ForbiddenException("You can only assign trainings to your own team");
            }
        }
        if (learnerId != null) {
            User learner = userRepository.findById(learnerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Learner not found"));
            if (!companyId.equals(learner.getCompanyId())) {
                throw new ForbiddenException("Learner belongs to another company");
            }
            if (teamId != null && !teamMemberRepository.existsByTeamIdAndUserIdAndCompanyId(teamId, learnerId, companyId)) {
                throw new BadRequestException("Learner is not a member of the target team");
            }
        }
    }

    private void ensureNotDuplicate(Long trainingId, Long companyId, Long teamId, Long learnerId) {
        boolean exists = learnerId != null
                ? assignmentRepository.existsByTrainingIdAndCompanyIdAndLearnerIdAndStatus(trainingId, companyId, learnerId, AssignmentStatus.ACTIVE)
                : teamId != null
                ? assignmentRepository.existsByTrainingIdAndCompanyIdAndTeamIdAndLearnerIdIsNullAndStatus(trainingId, companyId, teamId, AssignmentStatus.ACTIVE)
                : assignmentRepository.existsByTrainingIdAndCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(trainingId, companyId, AssignmentStatus.ACTIVE);
        if (exists) {
            throw new DuplicateResourceException("Training is already assigned to this scope");
        }
    }

    private void notifyTargets(TrainingAssignment assignment, Training training) {
        if (assignment.getLearnerId() != null) {
            notificationService.notify(assignment.getLearnerId(), "Training assigned", training.getTitle() + " was assigned to you", NotificationType.TRAINING_ASSIGNED);
            return;
        }
        if (assignment.getTeamId() != null) {
            teamMemberRepository.findByTeamIdAndCompanyId(assignment.getTeamId(), assignment.getCompanyId())
                    .forEach(member -> notificationService.notify(member.getUserId(), "Training assigned", training.getTitle() + " was assigned to your team", NotificationType.TRAINING_ASSIGNED));
        }
    }

    private List<Long> normalizedTargets(List<Long> ids, String message) {
        List<Long> normalized = ids == null ? List.of() : ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (normalized.isEmpty()) {
            throw new BadRequestException(message);
        }
        return normalized;
    }
}
