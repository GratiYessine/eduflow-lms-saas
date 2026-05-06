package com.example.lms.teams.service;

import com.example.lms.TestSecurity;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.teams.dto.TeamCreateRequest;
import com.example.lms.teams.mapper.TeamMapper;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.teams.repository.TeamRepository;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import com.example.lms.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TrainingAssignmentRepository assignmentRepository;
    @Mock TrainingRepository trainingRepository;
    @Mock UserRepository userRepository;
    @Mock TeamMapper teamMapper;
    @Mock PasswordEncoder passwordEncoder;
    @Mock NotificationService notificationService;
    @Mock InvitationService invitationService;
    @Mock SecureTokenService secureTokenService;
    @Mock StringSanitizer sanitizer;
    @InjectMocks TeamService teamService;

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void createRejectsDuplicateTeamNameInsideCompany() {
        TestSecurity.authenticate(1L, Role.COMPANY_ADMIN, 10L);
        when(sanitizer.clean("Engineering")).thenReturn("Engineering");
        when(teamRepository.existsByCompanyIdAndNameIgnoreCase(10L, "Engineering")).thenReturn(true);

        assertThatThrownBy(() -> teamService.create(new TeamCreateRequest("Engineering", null, null)))
                .isInstanceOf(DuplicateResourceException.class);
    }
}
