package com.example.lms.trainings.service;

import com.example.lms.TestSecurity;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.trainings.dto.TrainingCreateRequest;
import com.example.lms.trainings.entity.TrainingLevel;
import com.example.lms.trainings.mapper.TrainingMapper;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrainingServiceTest {

    @Mock TrainingRepository trainingRepository;
    @Mock TrainingMapper trainingMapper;
    @Mock AuditService auditService;
    @Mock StringSanitizer sanitizer;
    @InjectMocks TrainingService trainingService;

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void createGeneratesTrainerOwnedSlug() {
        TestSecurity.authenticate(42L, Role.TRAINER, null);
        when(sanitizer.clean(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(trainingRepository.existsBySlug("java-basics")).thenReturn(false);
        when(trainingRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        trainingService.create(new TrainingCreateRequest("Java Basics", "Short", "Long", null, null, "Backend", TrainingLevel.BEGINNER, "en", 120, BigDecimal.ZERO));

        ArgumentCaptor<com.example.lms.trainings.entity.Training> captor = ArgumentCaptor.forClass(com.example.lms.trainings.entity.Training.class);
        verify(trainingRepository).save(captor.capture());
        assertThat(captor.getValue().getTrainerId()).isEqualTo(42L);
        assertThat(captor.getValue().getSlug()).isEqualTo("java-basics");
    }
}
