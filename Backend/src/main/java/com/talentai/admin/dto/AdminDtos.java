package com.talentai.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record RoleItem(Integer roleId, String name) {
    }

    public record CreateRoleRequest(@NotBlank String name, List<String> permissions) {
    }

    public record CreateRoleResponse(Integer roleId, String message) {
    }

    public record AssignRoleRequest(@NotNull Integer roleId) {
    }

    public record AssignRoleResponse(Long userId, List<String> roles) {
    }

    public record AuditEntry(String user, String action, String entity, String timestamp) {
    }
}
