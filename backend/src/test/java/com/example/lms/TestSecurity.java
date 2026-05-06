package com.example.lms;

import com.example.lms.security.UserPrincipal;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

public final class TestSecurity {

    private TestSecurity() {
    }

    public static void authenticate(Long userId, Role role, Long companyId) {
        User user = new User();
        user.setId(userId);
        user.setEmail("user" + userId + "@example.com");
        user.setPassword("encoded");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setCompanyId(companyId);
        UserPrincipal principal = new UserPrincipal(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    public static void clear() {
        SecurityContextHolder.clearContext();
    }
}
