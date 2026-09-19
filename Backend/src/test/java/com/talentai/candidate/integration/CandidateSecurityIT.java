package com.talentai.candidate.integration;

import com.talentai.candidate.integration.support.CandidateTestData;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import com.talentai.common.enums.RoleName;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security-layer integration tests for the candidate endpoints.
 *
 * <p>Object-level authorization is enforced by {@code @PreAuthorize} +
 * {@link com.talentai.candidate.security.CandidateAccessGuard}: recruitment
 * staff (Recruiter, Hiring Manager, Interviewer, HR Admin, System Admin) may
 * VIEW any candidate; admins may MODIFY any candidate; a Candidate may act only
 * on their own profile. These tests assert that a candidate cannot reach another
 * candidate's data while staff/admin identities can.
 */
@DisplayName("CandidateSecurityIT")
class CandidateSecurityIT extends IntegrationTestBase {

    @Test
    @DisplayName("shouldReturn401_WhenJwtIsMissing")
    void shouldReturn401_WhenJwtIsMissing() throws Exception {
        mockMvc.perform(get("/v1/candidates/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("shouldReturn401_WhenJwtIsInvalid")
    void shouldReturn401_WhenJwtIsInvalid() throws Exception {
        mockMvc.perform(get("/v1/candidates/me").header("Authorization", "Bearer not-a-real-jwt-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("shouldReturn401_WhenJwtIsExpired")
    void shouldReturn401_WhenJwtIsExpired() throws Exception {
        long userId = registerUser();

        mockMvc.perform(get("/v1/candidates/me").header("Authorization", expiredBearer(userId)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("shouldReturn403_WhenCandidateViewsAnotherCandidate")
    void shouldReturn403_WhenCandidateViewsAnotherCandidate() throws Exception {
        Seeded owner = seedCandidate();
        Seeded intruder = seedCandidate();

        // A different candidate must NOT be able to read the owner's profile (object-level authorization).
        mockMvc.perform(get("/v1/candidates/{id}", owner.candidateId()).header("Authorization", bearer(intruder.userId())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("shouldReturn403_WhenCandidateModifiesAnotherCandidate")
    void shouldReturn403_WhenCandidateModifiesAnotherCandidate() throws Exception {
        Seeded owner = seedCandidate();
        Seeded intruder = seedCandidate();

        mockMvc.perform(put("/v1/candidates/{id}", owner.candidateId())
                        .header("Authorization", bearer(intruder.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.updateCandidate())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("shouldAllowCandidateToViewOwnProfile")
    void shouldAllowCandidateToViewOwnProfile() throws Exception {
        Seeded owner = seedCandidate();

        mockMvc.perform(get("/v1/candidates/{id}", owner.candidateId()).header("Authorization", bearer(owner.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value((int) owner.candidateId()));
    }

    @Test
    @DisplayName("shouldAllowRecruiterToViewCandidate")
    void shouldAllowRecruiterToViewCandidate() throws Exception {
        Seeded candidate = seedCandidate();
        long recruiterUserId = registerUser();
        grantRole(recruiterUserId, RoleName.RECRUITER);

        mockMvc.perform(get("/v1/candidates/{id}", candidate.candidateId())
                        .header("Authorization", bearer(recruiterUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value((int) candidate.candidateId()));
    }

    @Test
    @DisplayName("shouldAllowAdminToManageCandidate")
    void shouldAllowAdminToManageCandidate() throws Exception {
        Seeded candidate = seedCandidate();
        long adminUserId = registerUser();
        grantRole(adminUserId, RoleName.HR_ADMIN);

        mockMvc.perform(put("/v1/candidates/{id}", candidate.candidateId())
                        .header("Authorization", bearer(adminUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.updateCandidate())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully."));
    }

    @Test
    @DisplayName("shouldAllowInterviewerToViewCandidate")
    void shouldAllowInterviewerToViewCandidate() throws Exception {
        // Interviewer is recruitment staff and may view (but not modify) any candidate.
        Seeded candidate = seedCandidate();
        long interviewerUserId = registerUser();
        grantRole(interviewerUserId, RoleName.INTERVIEWER);

        mockMvc.perform(get("/v1/candidates/{id}", candidate.candidateId())
                        .header("Authorization", bearer(interviewerUserId)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("shouldReturn403_WhenRecruiterModifiesCandidate")
    void shouldReturn403_WhenRecruiterModifiesCandidate() throws Exception {
        // Recruiter can view but must NOT edit a candidate's data (only owner/admin may).
        Seeded candidate = seedCandidate();
        long recruiterUserId = registerUser();
        grantRole(recruiterUserId, RoleName.RECRUITER);

        mockMvc.perform(put("/v1/candidates/{id}", candidate.candidateId())
                        .header("Authorization", bearer(recruiterUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.updateCandidate())))
                .andExpect(status().isForbidden());
    }
}
