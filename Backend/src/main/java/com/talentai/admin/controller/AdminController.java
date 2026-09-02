package com.talentai.admin.controller;

import com.talentai.admin.dto.AdminDtos.*;
import com.talentai.audit.entity.AuditLog;
import com.talentai.audit.repository.AuditLogRepository;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.common.response.ListResponse;
import com.talentai.user.entity.Role;
import com.talentai.user.entity.User;
import com.talentai.user.entity.UserRole;
import com.talentai.user.repository.RoleRepository;
import com.talentai.user.repository.UserRepository;
import com.talentai.user.repository.UserRoleRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.talentai.security.UserPrincipal;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR_ADMIN','SYSTEM_ADMIN')")
public class AdminController {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/roles")
    public ResponseEntity<ListResponse<RoleItem>> getRoles() {
        List<RoleItem> data = roleRepository.findAll().stream()
                .map(r -> new RoleItem(r.getRoleId(), r.getRoleName())).toList();
        return ResponseEntity.ok(ListResponse.of(data));
    }

    @PostMapping("/roles")
    @Transactional
    public ResponseEntity<CreateRoleResponse> createRole(@Valid @RequestBody CreateRoleRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        if (roleRepository.findByRoleName(req.name()).isPresent()) {
            throw new DuplicateResourceException("A role with this name already exists.");
        }
        // The role table has no permissions column (V2); permissions in the
        // request are accepted for API compatibility but not persisted here.
        Role role = roleRepository.save(Role.builder()
                .roleName(req.name()).createdBy(principal.getUserId()).isActive(true).build());
        return ResponseEntity.status(HttpStatus.CREATED).body(new CreateRoleResponse(role.getRoleId(), "Role created."));
    }

    @PostMapping("/users/{userId}/roles")
    @Transactional
    public ResponseEntity<AssignRoleResponse> assignRole(@PathVariable Long userId, @Valid @RequestBody AssignRoleRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Role role = roleRepository.findById(req.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + req.roleId()));
        if (!userRoleRepository.existsByUser_UserIdAndRole_RoleId(userId, req.roleId())) {
            userRoleRepository.save(UserRole.builder().user(user).role(role)
                    .createdBy(principal.getUserId()).isActive(true).build());
        }
        List<String> roles = userRoleRepository.findByUser_UserIdAndIsActiveTrue(userId).stream()
                .map(ur -> ur.getRole().getRoleName()).toList();
        return ResponseEntity.ok(new AssignRoleResponse(userId, roles));
    }

    @GetMapping("/audit")
    public ResponseEntity<ListResponse<AuditEntry>> audit(@RequestParam(required = false) String entityType,
                                                          @RequestParam(required = false) Long entityId,
                                                          @RequestParam(defaultValue = "1") int page,
                                                          @RequestParam(defaultValue = "50") int size) {
        var result = auditLogRepository.search(entityType, entityId, PageRequest.of(Math.max(0, page - 1), size));
        List<AuditLog> logs = result.getContent();
        Map<Long, User> users = userRepository.findAllById(
                        logs.stream().map(AuditLog::getUserId).filter(java.util.Objects::nonNull).toList()).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        List<AuditEntry> data = logs.stream().map(l -> {
            User u = l.getUserId() == null ? null : users.get(l.getUserId());
            String name = u == null ? "System" : u.getFirstName() + " " + u.getLastName();
            String entity = l.getEntityType() + (l.getEntityId() == null ? "" : ":" + l.getEntityId());
            String ts = l.getActionDate() == null ? null : l.getActionDate().format(fmt);
            return new AuditEntry(name, l.getActionType(), entity, ts);
        }).toList();
        return ResponseEntity.ok(ListResponse.of(data, result.getTotalElements(), page, size));
    }
}
