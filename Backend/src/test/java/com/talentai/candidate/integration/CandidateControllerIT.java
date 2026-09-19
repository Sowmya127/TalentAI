package com.talentai.candidate.integration;

import com.talentai.candidate.dto.CandidateDtos.CreateCandidateRequest;
import com.talentai.candidate.integration.support.CandidateTestData;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import com.talentai.common.enums.RoleName;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests for candidate registration and profile management, exercised
 * through the real HTTP stack (MockMvc → Spring Security/JWT → service →
 * repository → MySQL).
 */
@DisplayName("CandidateControllerIT")
class CandidateControllerIT extends IntegrationTestBase {

    // ---- Registration flow (candidate self-registration) ----

    @Test
    @DisplayName("shouldRegisterAndLoginCandidate_WhenValidRequest")
    void shouldRegisterAndLoginCandidate_WhenValidRequest() throws Exception {
        // Arrange
        String email = uniqueEmail();
        Map<String, Object> register = Map.of(
                "firstName", "Ada", "lastName", "Lovelace", "email", email,
                "password", "Password@123", "phoneNumber", "+91-9000000001");

        // Act & Assert — register
        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.message").value("Registration successful"));

        // Act & Assert — login with the same credentials
        mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_CANDIDATE"));
    }

    @Test
    @DisplayName("shouldReturn409_WhenRegisteringDuplicateEmail")
    void shouldReturn409_WhenRegisteringDuplicateEmail() throws Exception {
        String email = uniqueEmail();
        Map<String, Object> body = Map.of(
                "firstName", "Grace", "lastName", "Hopper", "email", email, "password", "Password@123");

        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))).andExpect(status().isCreated());

        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("shouldReturn422_WhenRegisteringWithInvalidEmail")
    void shouldReturn422_WhenRegisteringWithInvalidEmail() throws Exception {
        Map<String, Object> body = Map.of(
                "firstName", "Alan", "lastName", "Turing", "email", "not-an-email", "password", "Password@123");

        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("shouldReturn422_WhenRegistrationFieldsMissing")
    void shouldReturn422_WhenRegistrationFieldsMissing() throws Exception {
        // Missing lastName and password
        Map<String, Object> body = Map.of("firstName", "Nobody", "email", uniqueEmail());

        mockMvc.perform(post("/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---- Profile creation ----

    @Test
    @DisplayName("shouldCreateCandidate_WhenValidRequest")
    void shouldCreateCandidate_WhenValidRequest() throws Exception {
        long userId = registerUser();

        mockMvc.perform(post("/v1/candidates").header("Authorization", bearer(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.createCandidate(userId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.candidateId").isNumber())
                .andExpect(jsonPath("$.message").value("Candidate profile created."));

        assertThat(candidateRepository.existsByUserId(userId)).isTrue();
    }

    @Test
    @DisplayName("shouldReturn422_WhenUserIdMissing")
    void shouldReturn422_WhenUserIdMissing() throws Exception {
        long userId = registerUser();
        String body = objectMapper.writeValueAsString(new CreateCandidateRequest(null, "+91", "Bengaluru"));

        mockMvc.perform(post("/v1/candidates").header("Authorization", bearer(userId))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("shouldReturn409_WhenDuplicateProfile")
    void shouldReturn409_WhenDuplicateProfile() throws Exception {
        Seeded seeded = seedCandidate();
        String body = objectMapper.writeValueAsString(CandidateTestData.createCandidate(seeded.userId()));

        mockMvc.perform(post("/v1/candidates").header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("shouldReturn404_WhenCreatingProfileForUnknownUser")
    void shouldReturn404_WhenCreatingProfileForUnknownUser() throws Exception {
        // Creating a profile for another (here, unknown) user is an admin action.
        long adminUserId = registerUser();
        grantRole(adminUserId, RoleName.HR_ADMIN);
        String body = objectMapper.writeValueAsString(new CreateCandidateRequest(9_999_999L, "+91", "Bengaluru"));

        mockMvc.perform(post("/v1/candidates").header("Authorization", bearer(adminUserId))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    // ---- Read / update ----

    @Test
    @DisplayName("shouldGetOwnProfile_ViaMe")   // Get Candidate By User ID
    void shouldGetOwnProfile_ViaMe() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(get("/v1/candidates/me").header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value((int) seeded.candidateId()))
                .andExpect(jsonPath("$.location").value("Bengaluru"));
    }

    @Test
    @DisplayName("shouldGetCandidateById")
    void shouldGetCandidateById() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(get("/v1/candidates/{id}", seeded.candidateId()).header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value((int) seeded.candidateId()))
                .andExpect(jsonPath("$.email").isString());
    }

    @Test
    @DisplayName("shouldReturn404_WhenCandidateNotFound")
    void shouldReturn404_WhenCandidateNotFound() throws Exception {
        // Staff may view any candidate, so an unknown id resolves to 404 (not 403) for them.
        long recruiterUserId = registerUser();
        grantRole(recruiterUserId, RoleName.RECRUITER);

        mockMvc.perform(get("/v1/candidates/{id}", 9_999_999L).header("Authorization", bearer(recruiterUserId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("shouldUpdateCandidate_WhenValidRequest")
    void shouldUpdateCandidate_WhenValidRequest() throws Exception {
        Seeded seeded = seedCandidate();
        String body = objectMapper.writeValueAsString(CandidateTestData.updateCandidate());

        mockMvc.perform(put("/v1/candidates/{id}", seeded.candidateId()).header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully."));

        // Verify it actually persisted to MySQL
        mockMvc.perform(get("/v1/candidates/{id}", seeded.candidateId()).header("Authorization", bearer(seeded.userId())))
                .andExpect(jsonPath("$.location").value("Hyderabad"));
    }

    // ---- REST/API concerns ----

    @Test
    @DisplayName("shouldReturnJsonContentTypeHeader")
    void shouldReturnJsonContentTypeHeader() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(get("/v1/candidates/{id}", seeded.candidateId()).header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("shouldRespondWithinReasonableTime")
    void shouldRespondWithinReasonableTime() throws Exception {
        Seeded seeded = seedCandidate();

        long start = System.nanoTime();
        mockMvc.perform(get("/v1/candidates/{id}", seeded.candidateId()).header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk());
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertThat(elapsedMs).isLessThan(5_000L);
    }
}
