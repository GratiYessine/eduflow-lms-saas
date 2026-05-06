package com.example.lms.trainings.repository;

import com.example.lms.trainings.entity.Training;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface TrainingRepository extends JpaRepository<Training, Long>, JpaSpecificationExecutor<Training> {
    boolean existsBySlug(String slug);

    boolean existsByIdAndTrainerId(Long id, Long trainerId);

    Optional<Training> findByIdAndTrainerId(Long id, Long trainerId);

    List<Training> findByTrainerId(Long trainerId);
}
