package com.talentai.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/** BR-003/BR-004: only administrators activate/deactivate users. */
@Data
public class UpdateUserStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "Active|Inactive|Suspended", message = "Status must be Active, Inactive, or Suspended")
    private String status;
}
