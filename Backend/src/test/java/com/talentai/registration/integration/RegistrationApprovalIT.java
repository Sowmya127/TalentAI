package com.talentai.registration.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import com.talentai.common.enums.RoleName;
import com.talentai.registration.repository.UserRegistrationRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full-stack tests for self-registration + admin approval + the login gate. */
@DisplayName("RegistrationApprovalIT")
class RegistrationApprovalIT extends IntegrationTestBase {

    @Autowired
    private UserRegistrationRequestRepository requestRepository;

    private long registerViaApi(Map<String, Object> body) throws Exception {
        String json = mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(json);
        return node.get("userId").asLong();
    }

    private String adminToken() {
        long adminId = registerUser();
        grantRole(adminId, RoleName.SYSTEM_ADMIN);
        return bearer(adminId);
    }

    @Test
    @DisplayName("shouldOnlyExposeSelfRegisterableRoles_NoSystemAdmin")
    void shouldOnlyExposeSelfRegisterableRoles_NoSystemAdmin() throws Exception {
        String json = mockMvc.perform(get("/v1/public/roles"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json).contains("Candidate", "Recruiter", "Hiring Manager", "Interviewer", "HR Admin");
        assertThat(json).doesNotContain("System Admin");
    }

    @Test
    @DisplayName("shouldActivateCandidateImmediately")
    void shouldActivateCandidateImmediately() throws Exception {
        String email = uniqueEmail();
        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Cara", "lastName", "Ng", "email", email, "password", "Password@123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.message").value("Registration successful"));

        mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("shouldHoldRecruiterForApproval_ThenAllowLoginAfterApprove")
    void shouldHoldRecruiterForApproval_ThenAllowLoginAfterApprove() throws Exception {
        String email = uniqueEmail();
        long userId = registerViaApi(Map.of("firstName", "Rita", "lastName", "Cruz", "email", email,
                "password", "Password@123", "requestedRole", "Recruiter", "companyName", "Acme"));

        // Pending -> login denied with the specific message
        mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("REGISTRATION_PENDING"));

        long requestId = requestRepository.findByUserId(userId).orElseThrow().getRequestId();
        String admin = adminToken();

        mockMvc.perform(patch("/v1/admin/registration-requests/{id}/approve", requestId)
                        .header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Approved -> login now succeeds
        mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("shouldRejectRegistration_ThenDenyLoginWithReason")
    void shouldRejectRegistration_ThenDenyLoginWithReason() throws Exception {
        String email = uniqueEmail();
        long userId = registerViaApi(Map.of("firstName", "Hank", "lastName", "Moe", "email", email,
                "password", "Password@123", "requestedRole", "Hiring Manager"));
        long requestId = requestRepository.findByUserId(userId).orElseThrow().getRequestId();
        String admin = adminToken();

        mockMvc.perform(patch("/v1/admin/registration-requests/{id}/reject", requestId)
                        .header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Company could not be verified"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        mockMvc.perform(post("/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("REGISTRATION_REJECTED"));
    }

    @Test
    @DisplayName("shouldRejectSelfRegistrationAsSystemAdmin")
    void shouldRejectSelfRegistrationAsSystemAdmin() throws Exception {
        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Eve", "lastName", "Root", "email", uniqueEmail(),
                                "password", "Password@123", "requestedRole", "System Admin"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("ROLE_NOT_SELF_REGISTERABLE"));
    }

    @Test
    @DisplayName("shouldReturn403_WhenNonAdminAccessesQueue")
    void shouldReturn403_WhenNonAdminAccessesQueue() throws Exception {
        long candidateUserId = registerUser(); // candidate role only
        mockMvc.perform(get("/v1/admin/registration-requests").header("Authorization", bearer(candidateUserId)))
                .andExpect(status().isForbidden());
    }
}
