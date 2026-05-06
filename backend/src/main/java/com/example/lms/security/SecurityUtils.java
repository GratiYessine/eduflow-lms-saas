package com.example.lms.security;

import com.example.lms.users.entity.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal;
    }

    public static Long currentUserId() {
        UserPrincipal principal = currentUser();
        return principal == null ? null : principal.getId();
    }

    public static String currentEmail() {
        UserPrincipal principal = currentUser();
        return principal == null ? null : principal.getUsername();
    }

    public static Long currentCompanyId() {
        UserPrincipal principal = currentUser();
        return principal == null ? null : principal.getCompanyId();
    }

    public static Role currentRole() {
        UserPrincipal principal = currentUser();
        return principal == null ? null : principal.getRole();
    }
}
