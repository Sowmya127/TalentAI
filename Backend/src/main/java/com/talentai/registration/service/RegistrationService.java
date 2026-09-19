package com.talentai.registration.service;

import com.talentai.approval.entity.ApprovalHistory;
import com.talentai.approval.repository.ApprovalHistoryRepository;
import com.talentai.audit.service.AuditService;
import com.talentai.common.exception.BusinessException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.common.response.ListResponse;
import com.talentai.company.entity.Company;
import com.talentai.company.repository.CompanyRepository;
import com.talentai.notification.service.NotificationService;
import com.talentai.registration.dto.RegistrationDtos.*;
import com.talentai.registration.entity.UserRegistrationRequest;
import com.talentai.registration.repository.UserRegistrationRequestRepository;
import com.talentai.user.entity.Role;
import com.talentai.user.entity.User;
import com.talentai.user.entity.UserRole;
import com.talentai.user.repository.RoleRepository;
import com.talentai.user.repository.UserRepository;
import com.talentai.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Admin approval module for self-registration requests: review queue, details,
 *  approval history, approve and reject. */
@Service
@RequiredArgsConstructor
public class RegistrationService {

    private static final String ENTITY = "Registration";

    private final UserRegistrationRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CompanyRepository companyRepository;
    private final UserRoleRepository userRoleRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    // Whitelist of sortable columns -> native column names (native query, so no property mapping).
    private static final Map<String, String> SORT_COLUMNS = Map.of(
            "submittedAt", "submitted_at",
            "status", "status",
            "reviewedAt", "reviewed_at");

    @Transactional(readOnly = true)
    public ListResponse<RegistrationRequestSummary> queue(String status, String search,
                                                          int page, int size, String sortBy, String direction) {
        String column = SORT_COLUMNS.getOrDefault(sortBy, "submitted_at");
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), size, Sort.by(dir, column));
        String q = (search == null || search.isBlank()) ? null : search.trim().toLowerCase();

        Page<UserRegistrationRequest> result = requestRepository.search(blankToNull(status), q, pageable);
        List<UserRegistrationRequest> rows = result.getContent();

        // Batch-load the referenced users/roles/companies so the page renders in a fixed
        // number of queries instead of 3 lookups per row (N+1).
        Map<Long, User> users = userRepository.findAllById(
                        rows.stream().map(UserRegistrationRequest::getUserId).filter(java.util.Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(User::getUserId, Function.identity()));
        Map<Integer, String> roles = roleRepository.findAllById(
                        rows.stream().map(UserRegistrationRequest::getRequestedRoleId).filter(java.util.Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(Role::getRoleId, Role::getRoleName));
        Map<Long, String> companies = companyRepository.findAllById(
                        rows.stream().map(UserRegistrationRequest::getCompanyId).filter(java.util.Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(Company::getCompanyId, Company::getCompanyName));

        List<RegistrationRequestSummary> data = rows.stream()
                .map(r -> toSummary(r, users, roles, companies)).toList();
        return ListResponse.of(data, result.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    public RegistrationRequestDetail getDetail(Long requestId) {
        UserRegistrationRequest r = findOrThrow(requestId);
        User u = userRepository.findById(r.getUserId()).orElse(null);
        String reviewerName = r.getReviewedBy() == null ? null
                : userRepository.findById(r.getReviewedBy()).map(this::fullName).orElse(null);

        List<ApprovalHistoryItem> history = approvalHistoryRepository
                .findByEntityTypeAndEntityIdOrderByActionDateDesc(ENTITY, requestId).stream()
                .map(h -> new ApprovalHistoryItem(h.getApprovalId(), h.getDecision(), h.getApproverId(),
                        userRepository.findById(h.getApproverId()).map(this::fullName).orElse(null),
                        h.getComments(), str(h.getActionDate())))
                .toList();

        return new RegistrationRequestDetail(r.getRequestId(), r.getUserId(),
                u == null ? null : fullName(u), u == null ? null : u.getEmail(), u == null ? null : u.getPhoneNumber(),
                roleName(r.getRequestedRoleId()), companyName(r.getCompanyId()), r.getOrganizationEmail(),
                r.getStatus(), u == null ? null : u.getVerificationStatus(), str(r.getSubmittedAt()),
                r.getReviewedBy(), reviewerName, str(r.getReviewedAt()), r.getRejectionReason(), history);
    }

    @Transactional(readOnly = true)
    public List<ApprovalHistoryItem> getHistory(Long requestId) {
        findOrThrow(requestId);
        return approvalHistoryRepository.findByEntityTypeAndEntityIdOrderByActionDateDesc(ENTITY, requestId).stream()
                .map(h -> new ApprovalHistoryItem(h.getApprovalId(), h.getDecision(), h.getApproverId(),
                        userRepository.findById(h.getApproverId()).map(this::fullName).orElse(null),
                        h.getComments(), str(h.getActionDate())))
                .toList();
    }

    @Transactional
    public RegistrationDecisionResponse approve(Long requestId, String comments, Long adminUserId) {
        UserRegistrationRequest r = requirePending(requestId);
        User user = userRepository.findById(r.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + r.getUserId()));
        Role role = roleRepository.findById(r.getRequestedRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + r.getRequestedRoleId()));

        LocalDateTime now = LocalDateTime.now();
        r.setStatus("APPROVED");
        r.setReviewedBy(adminUserId);
        r.setReviewedAt(now);
        r.setModifiedBy(adminUserId);
        requestRepository.save(r);

        user.setUserStatus("Active");
        user.setApprovalStatus("APPROVED");
        user.setVerificationStatus("Verified");
        user.setApprovedBy(adminUserId);
        user.setApprovedTimestamp(now);
        user.setLastReviewedTimestamp(now);
        user.setModifiedBy(adminUserId);
        userRepository.save(user);

        if (!userRoleRepository.existsByUser_UserIdAndRole_RoleId(user.getUserId(), role.getRoleId())) {
            userRoleRepository.save(UserRole.builder().user(user).role(role).createdBy(adminUserId).build());
        }

        recordDecision(requestId, adminUserId, "Approved", comments, now);
        auditService.log(adminUserId, "APPROVE", ENTITY, requestId, null, Map.of("userId", user.getUserId()));
        auditService.log(adminUserId, "ROLE_ASSIGNMENT", "User", user.getUserId(), null, role.getRoleName());
        auditService.log(adminUserId, "ACTIVATION", "User", user.getUserId(), null, "Active");
        notificationService.notifyUser(user.getUserId(), "Registration approved",
                "Your " + role.getRoleName() + " registration has been approved. You can now log in.", adminUserId);

        return new RegistrationDecisionResponse(requestId, "APPROVED", "Registration approved.");
    }

    @Transactional
    public RegistrationDecisionResponse reject(Long requestId, String reason, Long adminUserId) {
        UserRegistrationRequest r = requirePending(requestId);
        User user = userRepository.findById(r.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + r.getUserId()));

        LocalDateTime now = LocalDateTime.now();
        r.setStatus("REJECTED");
        r.setReviewedBy(adminUserId);
        r.setReviewedAt(now);
        r.setRejectionReason(reason);
        r.setModifiedBy(adminUserId);
        requestRepository.save(r);

        user.setApprovalStatus("REJECTED");
        user.setVerificationStatus("Failed");
        user.setRejectionReason(reason);
        user.setLastReviewedTimestamp(now);
        user.setModifiedBy(adminUserId);
        userRepository.save(user); // user_status stays Inactive -> cannot log in

        recordDecision(requestId, adminUserId, "Rejected", reason, now);
        auditService.log(adminUserId, "REJECT", ENTITY, requestId, null, Map.of("userId", user.getUserId(), "reason", reason));
        notificationService.notifyUser(user.getUserId(), "Registration rejected",
                "Your registration was rejected. Reason: " + reason, adminUserId);

        return new RegistrationDecisionResponse(requestId, "REJECTED", "Registration rejected.");
    }

    // --- helpers ---

    private UserRegistrationRequest requirePending(Long requestId) {
        UserRegistrationRequest r = findOrThrow(requestId);
        if (!"PENDING_APPROVAL".equals(r.getStatus())) {
            throw new BusinessException("ALREADY_REVIEWED", "This registration request has already been reviewed.");
        }
        return r;
    }

    private UserRegistrationRequest findOrThrow(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration request not found: " + requestId));
    }

    private void recordDecision(Long requestId, Long adminUserId, String decision, String comments, LocalDateTime now) {
        approvalHistoryRepository.save(ApprovalHistory.builder()
                .entityType(ENTITY).entityId(requestId).approvalStage("AdminApproval")
                .approverId(adminUserId).decision(decision).comments(comments).actionDate(now)
                .createdBy(adminUserId).isActive(true).build());
    }

    /** Maps one row using pre-fetched lookup maps (see {@link #queue}) — no per-row queries. */
    private RegistrationRequestSummary toSummary(UserRegistrationRequest r, Map<Long, User> users,
                                                 Map<Integer, String> roles, Map<Long, String> companies) {
        User u = r.getUserId() == null ? null : users.get(r.getUserId());
        String role = r.getRequestedRoleId() == null ? null : roles.get(r.getRequestedRoleId());
        String company = r.getCompanyId() == null ? null : companies.get(r.getCompanyId());
        return new RegistrationRequestSummary(r.getRequestId(), r.getUserId(),
                u == null ? null : fullName(u), u == null ? null : u.getEmail(),
                role, company, r.getOrganizationEmail(),
                r.getStatus(), str(r.getSubmittedAt()));
    }

    private String roleName(Integer roleId) {
        return roleId == null ? null : roleRepository.findById(roleId).map(Role::getRoleName).orElse(null);
    }

    private String companyName(Long companyId) {
        return companyId == null ? null : companyRepository.findById(companyId).map(Company::getCompanyName).orElse(null);
    }

    private String fullName(User u) {
        return u.getFirstName() + " " + u.getLastName();
    }

    private String str(LocalDateTime t) {
        return t == null ? null : t.toString();
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
