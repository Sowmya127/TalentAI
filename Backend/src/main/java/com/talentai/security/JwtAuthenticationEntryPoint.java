package com.talentai.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentai.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** Runs whenever an unauthenticated request hits a protected endpoint --
 *  returns the same ErrorResponse shape as every other error, instead
 *  of Spring's default HTML/blank 401 page. */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        ErrorResponse body = ErrorResponse.of("UNAUTHENTICATED", "Authentication is required to access this resource.");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
