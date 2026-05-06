package com.example.lms.assignments.service;

import com.example.lms.TestSecurity;
import com.example.lms.assignments.dto.AssignmentResponse;
import com.example.lms.assignments.dto.AssignmentTargetType;
import com.example.lms.assignments.dto.BulkAssignmentRequest;
import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.entity.TrainingAssignment;
import com.example.lms.assignments.mapper.AssignmentMapper;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.teams.entity.Team;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.teams.repository.TeamRepository;
import com.example.lms.trainings.entity.Training;
import com.example.lms.trainings.entity.TrainingStatus;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

    @Mock TrainingAssignmentRepository assignmentRepository;
    @Mock TrainingRepository trainingRepository;
    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock UserRepository userRepository;
    @Mock AssignmentMapper assignmentMapper;
    @Mock NotificationService notificationService;
    @InjectMocks AssignmentService assignmentService;

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void companyAdminSeesCompanyAssignments() {
        TestSecurity.authenticate(66L, Role.COMPANY_ADMIN, 20L);
        TrainingAssignment assignment = assignment(16L, 13L, 20L, 10L, null);
        AssignmentResponse response = response(assignment);

        when(assignmentRepository.findByCompanyIdAndStatus(20L, AssignmentStatus.ACTIVE))
                .thenReturn(List.of(assignment));
        when(assignmentMapper.toResponse(assignment)).thenReturn(response);

        assertThat(assignmentService.myAssignments()).containsExactly(response);
    }

    @Test
    void teamManagerSeesAssignmentsForManagedTeamEvenWithoutTeamMembership() {
        TestSecurity.authenticate(67L, Role.TEAM_MANAGER, 20L);
        Team managedTeam = new Team();
        managedTeam.setId(10L);
        managedTeam.setCompanyId(20L);
        managedTeam.setManagerId(67L);
        managedTeam.setName("3afata");
        TrainingAssignment assignment = assignment(16L, 13L, 20L, 10L, null);
        AssignmentResponse response = response(assignment);

        when(teamMemberRepository.findByUserIdAndCompanyId(67L, 20L)).thenReturn(List.of());
        when(teamRepository.findByManagerIdAndCompanyId(67L, 20L)).thenReturn(List.of(managedTeam));
        when(assignmentRepository.findByCompanyIdAndLearnerIdAndStatus(20L, 67L, AssignmentStatus.ACTIVE))
                .thenReturn(List.of());
        when(assignmentRepository.findByCompanyIdAndTeamIdInAndLearnerIdIsNullAndStatus(
                eq(20L), anyCollection(), eq(AssignmentStatus.ACTIVE)))
                .thenReturn(List.of(assignment));
        when(assignmentRepository.findByCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(20L, AssignmentStatus.ACTIVE))
                .thenReturn(List.of());
        when(assignmentMapper.toResponse(assignment)).thenReturn(response);

        assertThat(assignmentService.myAssignments()).containsExactly(response);
    }

    @Test
    void bulkAssignmentCreatesOneAssignmentPerLearner() {
        TestSecurity.authenticate(66L, Role.COMPANY_ADMIN, 20L);
        Training training = new Training();
        training.setId(13L);
        training.setTitle("Security Awareness");
        training.setStatus(TrainingStatus.PUBLISHED);
        User firstLearner = learner(71L);
        User secondLearner = learner(72L);

        when(trainingRepository.findById(13L)).thenReturn(Optional.of(training));
        when(userRepository.findById(71L)).thenReturn(Optional.of(firstLearner));
        when(userRepository.findById(72L)).thenReturn(Optional.of(secondLearner));
        when(assignmentRepository.existsByTrainingIdAndCompanyIdAndLearnerIdAndStatus(13L, 20L, 71L, AssignmentStatus.ACTIVE)).thenReturn(false);
        when(assignmentRepository.existsByTrainingIdAndCompanyIdAndLearnerIdAndStatus(13L, 20L, 72L, AssignmentStatus.ACTIVE)).thenReturn(false);
        when(assignmentRepository.save(any(TrainingAssignment.class))).thenAnswer(invocation -> {
            TrainingAssignment saved = invocation.getArgument(0);
            saved.setId(saved.getLearnerId());
            return saved;
        });
        when(assignmentMapper.toResponse(any(TrainingAssignment.class))).thenAnswer(invocation -> response(invocation.getArgument(0)));

        List<AssignmentResponse> responses = assignmentService.assignBulk(new BulkAssignmentRequest(
                13L, 20L, AssignmentTargetType.LEARNER, List.of(), List.of(71L, 72L), null
        ));

        assertThat(responses).extracting(AssignmentResponse::learnerId).containsExactly(71L, 72L);
    }

    @Test
    void bulkAssignmentRejectsEmptyLearnerSelection() {
        TestSecurity.authenticate(66L, Role.COMPANY_ADMIN, 20L);

        assertThatThrownBy(() -> assignmentService.assignBulk(new BulkAssignmentRequest(
                13L, 20L, AssignmentTargetType.LEARNER, List.of(), List.of(), null
        ))).isInstanceOf(BadRequestException.class);
    }

    private static TrainingAssignment assignment(Long id, Long trainingId, Long companyId, Long teamId, Long learnerId) {
        TrainingAssignment assignment = new TrainingAssignment();
        assignment.setId(id);
        assignment.setTrainingId(trainingId);
        assignment.setCompanyId(companyId);
        assignment.setTeamId(teamId);
        assignment.setLearnerId(learnerId);
        assignment.setAssignedBy(66L);
        return assignment;
    }

    private static AssignmentResponse response(TrainingAssignment assignment) {
        return new AssignmentResponse(
                assignment.getId(),
                assignment.getTrainingId(),
                assignment.getCompanyId(),
                assignment.getTeamId(),
                assignment.getLearnerId(),
                assignment.getAssignedBy(),
                assignment.getDueDate(),
                assignment.getStatus(),
                assignment.getCreatedAt()
        );
    }

    private static User learner(Long id) {
        User user = new User();
        user.setId(id);
        user.setCompanyId(20L);
        user.setRole(Role.LEARNER);
        user.setEmail("learner" + id + "@example.test");
        return user;
    }
}
