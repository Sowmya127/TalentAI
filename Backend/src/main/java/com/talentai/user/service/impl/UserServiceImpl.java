package com.talentai.user.service.impl;

import com.talentai.audit.service.AuditService;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.user.dto.CreateUserRequest;
import com.talentai.user.dto.UpdateUserRequest;
import com.talentai.user.dto.UpdateUserStatusRequest;
import com.talentai.user.dto.UserResponse;
import com.talentai.user.entity.Role;
import com.talentai.user.entity.User;
import com.talentai.user.entity.UserRole;
import com.talentai.user.repository.RoleRepository;
import com.talentai.user.repository.UserRepository;
import com.talentai.user.repository.UserRoleRepository;
import com.talentai.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request, Long actorUserId) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A user with this email already exists.");
        }
        Role role = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRoleName()));

        // Use the administrator-supplied password if given so the new user can
        // log in immediately; otherwise fall back to a throwaway temp password
        // (TODO notification domain: email a "set your password" link instead).
        String initialPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : UUID.randomUUID().toString().substring(0, 12);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(initialPassword))
                .phoneNumber(request.getPhoneNumber())
                .userStatus("Active")
                .isActive(true)
                .createdBy(actorUserId)
                .build();
        user = userRepository.save(user);

        UserRole userRole = UserRole.builder().user(user).role(role).createdBy(actorUserId).build();
        userRoleRepository.save(userRole);

        auditService.log(actorUserId, "CREATE", "User", user.getUserId(), null, user);

        return toResponse(user, List.of(role.getRoleName()));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUser(Long userId) {
        User user = findUserOrThrow(userId);
        return toResponse(user, rolesFor(userId));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request, Long actorUserId) {
        User user = findUserOrThrow(userId);
        User before = snapshot(user);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        user.setModifiedBy(actorUserId);
        user = userRepository.save(user);

        auditService.log(actorUserId, "UPDATE", "User", userId, before, user);

        return toResponse(user, rolesFor(userId));
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request, Long actorUserId) {
        User user = findUserOrThrow(userId);
        User before = snapshot(user);

        user.setUserStatus(request.getStatus());
        user.setIsActive("Active".equals(request.getStatus()));
        user.setModifiedBy(actorUserId);
        user = userRepository.save(user);

        auditService.log(actorUserId, "STATUS_CHANGE", "User", userId, before, user);

        return toResponse(user, rolesFor(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String roleName, String status, Pageable pageable) {
        return userRepository.search(roleName, status, pageable)
                .map(u -> toResponse(u, rolesFor(u.getUserId())));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private List<String> rolesFor(Long userId) {
        return userRoleRepository.findByUser_UserIdAndIsActiveTrue(userId).stream()
                .map(ur -> ur.getRole().getRoleName())
                .toList();
    }

    private UserResponse toResponse(User user, List<String> roles) {
        return new UserResponse(user.getUserId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getPhoneNumber(), user.getUserStatus(), roles, Boolean.TRUE.equals(user.getIsActive()));
    }

    /** Shallow copy used only as the "before" side of an audit entry --
     *  not persisted, so an unmanaged/detached instance is fine here. */
    private User snapshot(User u) {
        return User.builder()
                .userId(u.getUserId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .userStatus(u.getUserStatus())
                .isActive(u.getIsActive())
                .build();
    }
}
