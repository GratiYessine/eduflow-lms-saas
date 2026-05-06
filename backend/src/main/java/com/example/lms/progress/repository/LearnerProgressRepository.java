package com.example.lms.progress.repository;

import com.example.lms.progress.entity.LearnerProgress;
import com.example.lms.progress.entity.ProgressStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LearnerProgressRepository extends JpaRepository<LearnerProgress, Long> {
    Optional<LearnerProgress> findByLearnerIdAndTrainingId(Long learnerId, Long trainingId);

    List<LearnerProgress> findByLearnerId(Long learnerId);

    List<LearnerProgress> findByTrainingIdIn(Collection<Long> trainingIds);

    List<LearnerProgress> findByTrainingIdInAndStatus(Collection<Long> trainingIds, ProgressStatus status);
}
