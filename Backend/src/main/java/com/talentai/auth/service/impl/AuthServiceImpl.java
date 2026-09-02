package com.talentai.auth.service.impl;

import com.talentai.audit.service.AuditService;
import com.talentai.auth.dto.AuthResponse;
import com.talentai.auth.dto.LoginRequest;
import com.talentai.auth.dto.RegisterRequest;
import com.talentai.auth.service.AuthService;
import com.talentai.common.enums.RoleName;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.security.JwtTokenProvider;
import com.talentai.security.UserPrincipal;
import com.talentai.user.entity.Role;
import com.talentai.user.entity.User;
import com.talentai.user.entity.UserRole;
import com.talentai.user.repository.RoleRepository;
import com.talentai.user.repository.UserRepository;
import com.talentai.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    @Override
    @Transactional
    public Long register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A user with this email already exists.");
        }
        Role candidateRole = roleRepository.findByRoleName(RoleName.CANDIDATE.getDbValue())
                .orElseThrow(() -> new IllegalStateException(
                        "Candidate role is not seeded -- check V25__seed_reference_data.sql ran."));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .userStatus("Active")
                .isActive(true)
                .build();
        user = userRepository.save(user);

        // Self-registered: the actor is the account itself.
        user.setCreatedBy(user.getUserId());
        user = userRepository.save(user);

        UserRole userRole = UserRole.builder().user(user).role(candidateRole).createdBy(user.getUserId()).build();
        userRoleRepository.save(userRole);

        auditService.log(user.getUserId(), "REGISTER", "User", user.getUserId(), null, user);

        // Candidate profile creation (US-015) is a separate step owned
        // by the candidate domain, not part of account registration.
        return user.getUserId();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateAccessToken(principal);

        List<String> roles = principal.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        String primaryRole = roles.isEmpty() ? null : roles.get(0).replace("ROLE_", "");

        auditService.log(principal.getUserId(), "LOGIN", "User", principal.getUserId(), null, null);

        return new AuthResponse(token, primaryRole, roles, jwtTokenProvider.getExpirationSeconds());
    }
}
