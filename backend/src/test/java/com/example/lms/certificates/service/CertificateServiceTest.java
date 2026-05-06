package com.example.lms.certificates.service;

import com.example.lms.TestSecurity;
import com.example.lms.audit.service.AuditService;
import com.example.lms.certificates.mapper.CertificateMapper;
import com.example.lms.certificates.repository.CertificateRepository;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import com.example.lms.files.service.FileStorageService;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.progress.entity.LearnerProgress;
import com.example.lms.progress.entity.ProgressStatus;
import com.example.lms.progress.repository.LearnerProgressRepository;
import com.example.lms.trainings.entity.Training;
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

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock CertificateRepository certificateRepository;
    @Mock LearnerProgressRepository progressRepository;
    @Mock TrainingRepository trainingRepository;
    @Mock UserRepository userRepository;
    @Mock FileStorageService fileStorageService;
    @Mock CertificateMapper certificateMapper;
    @Mock NotificationService notificationService;
    @Mock AuditService auditService;
    @InjectMocks CertificateService certificateService;

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void generateCreatesCertificateFileAfterTrainerApproval() {
        TestSecurity.authenticate(50L, Role.TRAINER, null);
        LearnerProgress progress = new LearnerProgress();
        progress.setId(1L);
        progress.setLearnerId(2L);
        progress.setTrainingId(3L);
        progress.setStatus(ProgressStatus.APPROVED);
        Training training = new Training();
        training.setId(3L);
        training.setTrainerId(50L);
        training.setTitle("Secure Java");
        User learner = new User();
        learner.setId(2L);
        learner.setFirstName("Lea");
        learner.setLastName("Rner");
        StoredFile file = new StoredFile();
        file.setId(9L);

        when(progressRepository.findById(1L)).thenReturn(Optional.of(progress));
        when(trainingRepository.findById(3L)).thenReturn(Optional.of(training));
        when(certificateRepository.findByLearnerIdAndTrainingId(2L, 3L)).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(learner));
        when(fileStorageService.storeGenerated(any(), eq("application/pdf"), any(), eq(FileCategory.CERTIFICATE))).thenReturn(file);
        when(certificateRepository.save(any())).thenAnswer(invocation -> {
            com.example.lms.certificates.entity.Certificate certificate = invocation.getArgument(0);
            certificate.setId(77L);
            return certificate;
        });

        certificateService.generate(1L);

        verify(certificateRepository).save(any());
        verify(notificationService).notify(eq(2L), any(), any(), any());
    }
}
