package com.talentai.candidate.integration;

import com.talentai.candidate.dto.CandidateDtos.UpdateSkillsRequest;
import com.talentai.candidate.integration.support.CandidateTestData;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Candidate skills integration tests (whole-list replace, full stack, real MySQL). */
@DisplayName("CandidateSkillIT")
class CandidateSkillIT extends IntegrationTestBase {

    private void putSkills(Seeded seeded, String... skills) throws Exception {
        mockMvc.perform(put("/v1/candidates/{id}/skills", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.skills(skills))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("shouldSetSkills")
    void shouldSetSkills() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(put("/v1/candidates/{id}/skills", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.skills("Java", "SQL"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value((int) seeded.candidateId()))
                .andExpect(jsonPath("$.skills", containsInAnyOrder("Java", "SQL")));
    }

    @Test
    @DisplayName("shouldReplaceSkills_OnSubsequentPut")
    void shouldReplaceSkills_OnSubsequentPut() throws Exception {
        Seeded seeded = seedCandidate();
        putSkills(seeded, "Java");

        putSkills(seeded, "Python", "AWS");

        mockMvc.perform(get("/v1/candidates/{id}/skills", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills", containsInAnyOrder("Python", "AWS")))
                .andExpect(jsonPath("$.skills", not(hasItem("Java"))));
    }

    @Test
    @DisplayName("shouldReAddSameSkill_WithoutDuplicateError")   // regression: delete-then-reinsert same skill
    void shouldReAddSameSkill_WithoutDuplicateError() throws Exception {
        Seeded seeded = seedCandidate();
        putSkills(seeded, "Java");

        // Re-saving a set that still contains "Java" must not hit the unique (candidate, skill) key.
        mockMvc.perform(put("/v1/candidates/{id}/skills", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.skills("Java", "SQL"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills", containsInAnyOrder("Java", "SQL")));
    }

    @Test
    @DisplayName("shouldReturn422_WhenSkillsNull")
    void shouldReturn422_WhenSkillsNull() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(put("/v1/candidates/{id}/skills", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateSkillsRequest(null))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("shouldReturn401_WhenNotAuthenticated")
    void shouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/v1/candidates/{id}/skills", 1L))
                .andExpect(status().isUnauthorized());
    }
}
