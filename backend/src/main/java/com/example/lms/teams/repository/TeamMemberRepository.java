package com.example.lms.teams.repository;

import com.example.lms.teams.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    boolean existsByTeamIdAndUserIdAndCompanyId(Long teamId, Long userId, Long companyId);

    Optional<TeamMember> findByIdAndTeamIdAndCompanyId(Long id, Long teamId, Long companyId);

    List<TeamMember> findByUserIdAndCompanyId(Long userId, Long companyId);

    List<TeamMember> findByTeamIdAndCompanyId(Long teamId, Long companyId);
}
