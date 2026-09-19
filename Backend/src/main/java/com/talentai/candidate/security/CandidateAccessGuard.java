package com.talentai.candidate.security;

import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Object-level authorization for the candidate module, invoked from
 * {@code @PreAuthorize} on {@link com.talentai.candidate.controller.CandidateController}
 * via the bean name {@code candidateAccessGuard}.
 *
 * <p>Without this, {@code anyRequest().authenticated()} was the only gate on
 * {@code /v1/candidates/**}, so any logged-in user could read or modify any
 * candidate by id (broken object-level authorization / IDOR). The rules here:
 * <ul>
 *   <li><b>View</b> — recruitment staff (Recruiter, Hiring Manager, Interviewer,
 *       HR Admin, System Admin) may view any candidate; a Candidate may view
 *       only their own profile.</li>
 *   <li><b>Modify</b> — admins (HR Admin, System Admin) may modify any candidate;
 *       everyone else may modify only their own profile. Recruiters and
 *       interviewers can view but not edit a candidate's data.</li>
 * </ul>
 * Ownership is resolved from the authenticated user id, never from a request
 * parameter, so it cannot be spoofed by the caller.
 */
@Component("candidateAccessGuard")
public class CandidateAccessGuard {

    /** Roles allowed to VIEW any candidate. */
    private static final Set<String> STAFF_VIEW = Set.of(
            "ROLE_RECRUITER", "ROLE_HIRING_MANAGER", "ROLE_INTERVIEWER", "ROLE_HR_ADMIN", "ROLE_SYSTEM_ADMIN");

    /** Roles allowed to MODIFY any candidate. */
    private static final Set<String> ADMIN_MANAGE = Set.of("ROLE_HR_ADMIN", "ROLE_SYSTEM_ADMIN");

    private final CandidateRepository candidateRepository;

    public CandidateAccessGuard(CandidateRepository candidateRepository) {
        this.candidateRepository = candidateRepository;
    }

    @Transactional(readOnly = true)
    public boolean canView(Long candidateId, Authentication authentication) {
        return hasAnyRole(authentication, STAFF_VIEW) || isOwner(candidateId, authentication);
    }

    @Transactional(readOnly = true)
    public boolean canModify(Long candidateId, Authentication authentication) {
        return hasAnyRole(authentication, ADMIN_MANAGE) || isOwner(candidateId, authentication);
    }

    private boolean isOwner(Long candidateId, Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null || candidateId == null) {
            return false;
        }
        return candidateRepository.findById(candidateId)
                .map(c -> userId.equals(c.getUserId()))
                .orElse(false);
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getUserId();
    }

    private boolean hasAnyRole(Authentication authentication, Set<String> roles) {
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (roles.contains(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
