package com.example.lms.security;

import com.example.lms.common.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final RateLimiter rateLimiter;

    public AuthRateLimitFilter(ObjectMapper objectMapper, RateLimiter rateLimiter) {
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!isProtectedAuthWrite(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        String key = clientIp(request) + ":" + request.getRequestURI();
        RateLimitResult result = rateLimiter.consume(key);
        if (!result.allowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(result.retryAfterSeconds()));
            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.error("Too many authentication requests. Please try again later.")));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isProtectedAuthWrite(HttpServletRequest request) {
        return HttpMethod.POST.matches(request.getMethod()) && request.getRequestURI().startsWith("/api/v1/auth/");
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

}
