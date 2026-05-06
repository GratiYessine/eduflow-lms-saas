package com.example.lms.companies.entity;

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
@Table(name = "companies")
public class Company extends BaseEntity {

    @Column(nullable = false, unique = true, length = 180)
    private String name;

    @Column(length = 120)
    private String industry;

    private String website;

    private String logoUrl;

    @Column(name = "company_size", length = 80)
    private String size;

    @Column(nullable = false, length = 80)
    private String subscriptionPlan = "FREE";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CompanyStatus status = CompanyStatus.ACTIVE;
}
