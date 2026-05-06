package com.example.lms.security;

import com.example.lms.TestSecurity;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.teams.repository.TeamRepository;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class TenantSecurityTest {

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void hasCompanyAccessAllowsOnlyCurrentTenantForCompanyUsers() {
        TestSecurity.authenticate(5L, Role.COMPANY_ADMIN, 100L);
        TenantSecurity tenantSecurity = new TenantSecurity(mock(TrainingRepository.class), mock(TeamRepository.class), mock(TeamMemberRepository.class));

        assertThat(tenantSecurity.hasCompanyAccess(100L)).isTrue();
        assertThat(tenantSecurity.hasCompanyAccess(200L)).isFalse();
    }
}
