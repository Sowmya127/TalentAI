package com.talentai.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.talentai.common.response.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Brute-force protection for {@code POST /v1/auth/login}: counts attempts per client
 * IP in a fixed time window and returns {@code 429} once the limit is exceeded. Uses
 * an in-process Caffeine cache (per instance) — good enough as a first line; a shared
 * store (Redis) would make it cluster-global. Disabled via config in the test profile.
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/v1/auth/login";

    private final boolean enabled;
    private final int maxAttempts;
    private final ObjectMapper objectMapper;
    private final Cache<String, AtomicInteger> attempts;

    public LoginRateLimitFilter(
            ObjectMapper objectMapper,
            @Value("${security.login.rate-limit.enabled:true}") boolean enabled,
            @Value("${security.login.rate-limit.max-attempts:10}") int maxAttempts,
            @Value("${security.login.rate-limit.window-seconds:60}") long windowSeconds) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.maxAttempts = maxAttempts;
        this.attempts = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(windowSeconds))
                .maximumSize(100_000)
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!enabled || !isLoginAttempt(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        String key = clientIp(request);
        int count = attempts.get(key, k -> new AtomicInteger()).incrementAndGet();
        if (count > maxAttempts) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            objectMapper.writeValue(response.getWriter(), ErrorResponse.of(
                    "RATE_LIMITED", "Too many login attempts. Please wait a minute and try again."));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isLoginAttempt(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI() != null && request.getRequestURI().endsWith(LOGIN_PATH);
    }

    /** First hop of X-Forwarded-For when behind a proxy/ALB, else the socket address. */
    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
