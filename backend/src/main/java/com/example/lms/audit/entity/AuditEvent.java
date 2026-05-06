package com.example.lms.audit.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "audit_events")
public class AuditEvent extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 80)
    private AuditAction action;

    private Long actorUserId;

    private Long targetUserId;

    private Long companyId;

    @Column(length = 120)
    private String resourceType;

    private Long resourceId;

    @Column(length = 80)
    private String outcome;

    @Column(columnDefinition = "text")
    private String details;
}
