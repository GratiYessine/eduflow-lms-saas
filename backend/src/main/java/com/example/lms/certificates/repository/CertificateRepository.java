package com.example.lms.certificates.repository;

import com.example.lms.certificates.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByLearnerId(Long learnerId);

    Optional<Certificate> findByVerificationCode(String verificationCode);

    Optional<Certificate> findByLearnerIdAndTrainingId(Long learnerId, Long trainingId);

    long countByTrainerId(Long trainerId);
}
