package com.example.lms.teams.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "teams", uniqueConstraints = @UniqueConstraint(name = "uk_teams_company_name", columnNames = {"company_id", "name"}))
public class Team extends BaseEntity {

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false)
    private Long companyId;

    private Long managerId;

    @Column(columnDefinition = "text")
    private String description;
}
