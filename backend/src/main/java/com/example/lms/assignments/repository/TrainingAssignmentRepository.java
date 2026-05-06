package com.example.lms.assignments.repository;

import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.entity.TrainingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TrainingAssignmentRepository extends JpaRepository<TrainingAssignment, Long> {
    List<TrainingAssignment> findByCompanyIdAndStatus(Long companyId, AssignmentStatus status);

    List<TrainingAssignment> findByCompanyIdAndLearnerIdAndStatus(Long companyId, Long learnerId, AssignmentStatus status);

    List<TrainingAssignment> findByCompanyIdAndTeamIdInAndLearnerIdIsNullAndStatus(Long companyId, Collection<Long> teamIds, AssignmentStatus status);

    List<TrainingAssignment> findByCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(Long companyId, AssignmentStatus status);

    List<TrainingAssignment> findByTrainingIdAndStatus(Long trainingId, AssignmentStatus status);

    List<TrainingAssignment> findByTrainingIdInAndStatus(Collection<Long> trainingIds, AssignmentStatus status);

    boolean existsByTrainingIdAndCompanyIdAndLearnerIdAndStatus(Long trainingId, Long companyId, Long learnerId, AssignmentStatus status);

    boolean existsByTrainingIdAndCompanyIdAndTeamIdAndLearnerIdIsNullAndStatus(Long trainingId, Long companyId, Long teamId, AssignmentStatus status);

    boolean existsByTrainingIdAndCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(Long trainingId, Long companyId, AssignmentStatus status);
}
