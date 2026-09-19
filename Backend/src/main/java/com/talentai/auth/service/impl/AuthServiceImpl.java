package com.talentai.auth.service.impl;

import com.talentai.audit.service.AuditService;
import com.talentai.auth.dto.AuthResponse;
import com.talentai.auth.dto.LoginRequest;
import com.talentai.auth.dto.RegisterRequest;
import com.talentai.auth.service.AuthService;
import com.talentai.common.enums.RoleName;
import com.talentai.common.exception.BusinessException;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.PendingApprovalException;
import com.talentai.common.exception.RegistrationRejectedException;
import com.talentai.company.entity.Company;
import com.talentai.company.repository.CompanyRepository;
import com.talentai.notification.service.NotificationService;
import com.talentai.registration.dto.RegistrationDtos.RegistrationResult;
import com.talentai.registration.entity.UserRegistrationRequest;
import com.talentai.registration.repository.UserRegistrationRequestRepository;
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
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final CompanyRepository companyRepository;
    private final UserRegistrationRequestRepository registrationRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;
    private final NotificationService notificationService;

    private static final List<String> ADMIN_ROLES =
            List.of(RoleName.SYSTEM_ADMIN.getDbValue(), RoleName.HR_ADMIN.getDbValue());

    @Override
    @Transactional
    public RegistrationResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A user with this email already exists.");
        }

        // Role is data-driven: default to Candidate; only self-registerable roles are allowed.
        String roleName = (request.getRequestedRole() == null || request.getRequestedRole().isBlank())
                ? RoleName.CANDIDATE.getDbValue()
                : request.getRequestedRole().trim();
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new BusinessException("ROLE_NOT_FOUND", "Unknown role: " + roleName));
        if (!Boolean.TRUE.equals(role.getSelfRegisterable())) {
            throw new BusinessException("ROLE_NOT_SELF_REGISTERABLE",
                    "The role '" + roleName + "' cannot be self-registered.");
        }
        boolean autoActivate = Boolean.TRUE.equals(role.getAutoActivate());

        // Optional company association + email-domain verification.
        Company company = resolveCompany(request);
        if (company != null && company.getEmailDomain() != null && !company.getEmailDomain().isBlank()
                && request.getOrganizationEmail() != null && request.getOrganizationEmail().contains("@")) {
            String domain = request.getOrganizationEmail().substring(request.getOrganizationEmail().indexOf('@') + 1);
            if (!domain.equalsIgnoreCase(company.getEmailDomain())) {
                throw new BusinessException("ORG_EMAIL_DOMAIN_MISMATCH",
                        "The organization email domain does not match the company's configured domain.");
            }
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .requestedRoleId(role.getRoleId())
                .companyId(company == null ? null : company.getCompanyId())
                .organizationEmail(request.getOrganizationEmail())
                .userStatus(autoActivate ? "Active" : "Inactive")
                .approvalStatus(autoActivate ? "NOT_REQUIRED" : "PENDING_APPROVAL")
                .verificationStatus(autoActivate ? "NotRequired" : "Pending")
                .isActive(true)
                .build();
        user = userRepository.save(user);
        user.setCreatedBy(user.getUserId());
        user = userRepository.save(user);

        UserRegistrationRequest reqRow = UserRegistrationRequest.builder()
                .userId(user.getUserId())
                .requestedRoleId(role.getRoleId())
                .companyId(company == null ? null : company.getCompanyId())
                .organizationEmail(request.getOrganizationEmail())
                .status(autoActivate ? "APPROVED" : "PENDING_APPROVAL")
                .submittedAt(LocalDateTime.now())
                .reviewedAt(autoActivate ? LocalDateTime.now() : null)
                .createdBy(user.getUserId())
                .isActive(true)
                .build();
        registrationRequestRepository.save(reqRow);

        auditService.log(user.getUserId(), "REGISTER", "User", user.getUserId(), null,
                java.util.Map.of("role", roleName, "autoActivate", autoActivate));

        if (autoActivate) {
            // Candidate: assign role and activate immediately.
            userRoleRepository.save(UserRole.builder().user(user).role(role).createdBy(user.getUserId()).build());
            auditService.log(user.getUserId(), "ROLE_ASSIGNMENT", "User", user.getUserId(), null, roleName);
            auditService.log(user.getUserId(), "ACTIVATION", "User", user.getUserId(), null, "Active");
            return new RegistrationResult(user.getUserId(), "ACTIVE", "Registration successful");
        }

        // Approval-required role: notify admins; role is NOT assigned until approval.
        notificationService.notifyRoles(ADMIN_ROLES, "New registration awaiting approval",
                roleName + " registration from " + user.getEmail() + " is pending your approval.", user.getUserId());
        return new RegistrationResult(user.getUserId(), "PENDING_APPROVAL",
                "Registration submitted. Your account is pending administrator approval.");
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (DisabledException ex) {
            // Give a specific, safe message for pending / rejected accounts.
            userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
                if ("PENDING_APPROVAL".equals(u.getApprovalStatus())) {
                    throw new PendingApprovalException("Your registration is pending administrator approval.");
                }
                if ("REJECTED".equals(u.getApprovalStatus())) {
                    throw new RegistrationRejectedException(u.getRejectionReason() != null && !u.getRejectionReason().isBlank()
                            ? "Your registration was rejected: " + u.getRejectionReason()
                            : "Your registration was rejected.");
                }
            });
            throw ex; // Inactive / Suspended -> handled as ACCOUNT_DISABLED (403)
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateAccessToken(principal);

        List<String> roles = principal.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        String primaryRole = roles.isEmpty() ? null : roles.get(0).replace("ROLE_", "");

        auditService.log(principal.getUserId(), "LOGIN", "User", principal.getUserId(), null, null);

        return new AuthResponse(token, primaryRole, roles, jwtTokenProvider.getExpirationSeconds());
    }

    /** Finds an existing company by name or creates a new (unverified) one. */
    private Company resolveCompany(RegisterRequest request) {
        if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
            return null;
        }
        String name = request.getCompanyName().trim();
        return companyRepository.findByCompanyNameIgnoreCase(name).orElseGet(() ->
                companyRepository.save(Company.builder()
                        .companyName(name)
                        .verificationStatus("Pending")
                        .isActive(true)
                        .build()));
    }
}
