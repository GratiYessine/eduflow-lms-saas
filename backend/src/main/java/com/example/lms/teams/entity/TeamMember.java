package com.example.lms.teams.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "team_members", uniqueConstraints = @UniqueConstraint(name = "uk_team_members_team_user", columnNames = {"team_id", "user_id"}))
public class TeamMember extends BaseEntity {

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long teamId;

    @Column(nullable = false)
    private Long companyId;

    @Column(length = 120)
    private String position;

    @Column(nullable = false)
    private Instant joinedAt = Instant.now();
}
