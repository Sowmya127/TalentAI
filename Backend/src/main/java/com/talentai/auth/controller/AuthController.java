package com.talentai.auth.controller;

import com.talentai.auth.dto.AuthResponse;
import com.talentai.auth.dto.LoginRequest;
import com.talentai.auth.dto.RegisterRequest;
import com.talentai.auth.service.AuthService;
import com.talentai.registration.dto.RegistrationDtos.RegistrationResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, unauthenticated endpoints (see SecurityConfig -- /v1/auth/**
 * is permitAll).
 *
 * Not implemented yet, both deferred until the notification domain
 * exists to actually send mail: POST /forgot-password, POST
 * /reset-password. POST /logout is intentionally omitted -- JWT auth
 * is stateless, so "logging out" is a client-side token discard with
 * nothing for the server to invalidate.
 */
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegistrationResult> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
