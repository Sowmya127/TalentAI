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
 * <p><b>Important — documented authorization behaviour.</b> The
 * {@code CandidateController} carries NO {@code @PreAuthorize} and NO
 * per-owner check: every candidate endpoint requires only a valid JWT
 * (authentication), not a particular role or ownership. These tests therefore
 * assert the ACTUAL behaviour of the running application (production code is not
 * modified). The two tests whose names end in {@code _authorizationGapDocumented}
 * capture a known gap: a candidate can read another candidate's profile, and no
 * role restriction exists. Add {@code @PreAuthorize}/ownership checks in the
 * controller if that is not intended — the tests will then need to flip to 403.
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
    @DisplayName("shouldReturn200_WhenCandidateViewsAnotherCandidate_authorizationGapDocumented")
    void shouldReturn200_WhenCandidateViewsAnotherCandidate_authorizationGapDocumented() throws Exception {
        Seeded owner = seedCandidate();
        Seeded intruder = seedCandidate();

        // A different authenticated candidate can currently read the owner's profile — no ownership check exists.
        mockMvc.perform(get("/v1/candidates/{id}", owner.candidateId()).header("Authorization", bearer(intruder.userId())))
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
    @DisplayName("shouldAllowAnyAuthenticatedRole_authorizationGapDocumented")
    void shouldAllowAnyAuthenticatedRole_authorizationGapDocumented() throws Exception {
        // Role-based authorization is NOT enforced on candidate endpoints: any authenticated
        // internal role can read a candidate. Demonstrated with an Interviewer identity.
        Seeded candidate = seedCandidate();
        long interviewerUserId = registerUser();
        grantRole(interviewerUserId, RoleName.INTERVIEWER);

        mockMvc.perform(get("/v1/candidates/{id}", candidate.candidateId())
                        .header("Authorization", bearer(interviewerUserId)))
                .andExpect(status().isOk());
    }
}
