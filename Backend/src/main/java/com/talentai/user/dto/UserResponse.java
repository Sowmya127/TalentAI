package com.talentai.user.dto;

import java.util.List;

public record UserResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String userStatus,
        List<String> roles,
        boolean isActive
) {
}
