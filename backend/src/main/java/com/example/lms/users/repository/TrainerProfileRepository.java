package com.example.lms.users.repository;

import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.TrainerVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainerProfileRepository extends JpaRepository<TrainerProfile, Long> {
    Optional<TrainerProfile> findByUserId(Long userId);

    List<TrainerProfile> findAllByOrderByCreatedAtDesc();

    List<TrainerProfile> findByVerificationStatusOrderByCreatedAtDesc(TrainerVerificationStatus status);
}
