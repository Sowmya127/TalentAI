package com.talentai.user.service;

import com.talentai.user.dto.CreateUserRequest;
import com.talentai.user.dto.UpdateUserRequest;
import com.talentai.user.dto.UpdateUserStatusRequest;
import com.talentai.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse createUser(CreateUserRequest request, Long actorUserId);

    UserResponse getUser(Long userId);

    UserResponse updateUser(Long userId, UpdateUserRequest request, Long actorUserId);

    UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request, Long actorUserId);

    Page<UserResponse> searchUsers(String roleName, String status, Pageable pageable);
}
