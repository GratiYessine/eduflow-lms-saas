package com.example.lms.teams.repository;

import com.example.lms.teams.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    boolean existsByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    boolean existsByIdAndManagerIdAndCompanyId(Long id, Long managerId, Long companyId);

    List<Team> findByManagerIdAndCompanyId(Long managerId, Long companyId);

    Page<Team> findByCompanyId(Long companyId, Pageable pageable);
}
