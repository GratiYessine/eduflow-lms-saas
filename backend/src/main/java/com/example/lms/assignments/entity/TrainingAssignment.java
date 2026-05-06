package com.example.lms.assignments.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "training_assignments")
public class TrainingAssignment extends BaseEntity {

    @Column(nullable = false)
    private Long trainingId;

    @Column(nullable = false)
    private Long companyId;

    private Long teamId;

    private Long learnerId;

    @Column(nullable = false)
    private Long assignedBy;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AssignmentStatus status = AssignmentStatus.ACTIVE;
}
