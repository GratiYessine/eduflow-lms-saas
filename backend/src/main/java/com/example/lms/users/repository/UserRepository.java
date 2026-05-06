package com.example.lms.users.repository;

import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRole(Role role);

    List<User> findByRole(Role role);

    Page<User> findByCompanyId(Long companyId, Pageable pageable);

    Page<User> findByCompanyIdAndRoleIn(Long companyId, Collection<Role> roles, Pageable pageable);

    List<User> findByCompanyIdAndRole(Long companyId, Role role);
}
