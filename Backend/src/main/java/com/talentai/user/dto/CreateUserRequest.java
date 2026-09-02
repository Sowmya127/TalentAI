package com.talentai.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Admin-created internal accounts (Recruiter, Hiring Manager,
 *  Interviewer, HR Admin, System Admin) -- distinct from candidate
 *  self-registration in AuthController (BR-003, US-002). */
@Data
public class CreateUserRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150)
    private String email;

    @NotBlank(message = "Role is required")
    private String roleName;

    @Size(max = 20)
    private String phoneNumber;
}
