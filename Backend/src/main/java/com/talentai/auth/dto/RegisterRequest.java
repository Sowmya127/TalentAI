package com.talentai.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Candidate self-registration only. Internal users (Recruiter, Hiring
 *  Manager, Interviewer, HR Admin, System Admin) are created by an
 *  administrator via POST /v1/users instead (BR-003). */
@Data
public class RegisterRequest {

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

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
             message = "Password must be at least 8 characters and include a letter and a number")
    private String password;

    @Size(max = 20)
    private String phoneNumber;

    /** Role name to register as (Candidate, Recruiter, Hiring Manager, Interviewer,
     *  HR Admin). Optional for backward compatibility — null/blank defaults to Candidate.
     *  Server rejects any role that is not self-registerable (e.g. System Admin). */
    @Size(max = 60)
    private String requestedRole;

    /** Employer/organization for non-candidate roles (optional). */
    @Size(max = 150)
    private String companyName;

    @Email(message = "Organization email must be valid")
    @Size(max = 150)
    private String organizationEmail;
}
