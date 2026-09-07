package com.talentai.candidate.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.talentai.candidate.integration.support.CandidateTestData;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Education CRUD integration tests (full stack, real MySQL). */
@DisplayName("CandidateEducationIT")
class CandidateEducationIT extends IntegrationTestBase {

    private long addEducation(Seeded seeded, Object body) throws Exception {
        String json = mockMvc.perform(post("/v1/candidates/{id}/education", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(json);
        return node.get("educationId").asLong();
    }

    @Test
    @DisplayName("shouldAddEducation_WhenValidRequest")
    void shouldAddEducation_WhenValidRequest() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/education", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.education().build())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.educationId").isNumber())
                .andExpect(jsonPath("$.degree").value("B.Tech"))
                .andExpect(jsonPath("$.endYear").value(2020));
    }

    @Test
    @DisplayName("shouldPersistStartYearAndFieldOfStudy")   // covers V29 columns
    void shouldPersistStartYearAndFieldOfStudy() throws Exception {
        Seeded seeded = seedCandidate();
        addEducation(seeded, CandidateTestData.education().startYear(2018).endYear(2022).fieldOfStudy("Data Science").build());

        mockMvc.perform(get("/v1/candidates/{id}/education", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].startYear").value(2018))
                .andExpect(jsonPath("$[0].fieldOfStudy").value("Data Science"));
    }

    @Test
    @DisplayName("shouldListEducationForCandidate")
    void shouldListEducationForCandidate() throws Exception {
        Seeded seeded = seedCandidate();
        addEducation(seeded, CandidateTestData.education().degree("M.Tech").build());

        mockMvc.perform(get("/v1/candidates/{id}/education", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].degree").value("M.Tech"));
    }

    @Test
    @DisplayName("shouldUpdateEducation")
    void shouldUpdateEducation() throws Exception {
        Seeded seeded = seedCandidate();
        long educationId = addEducation(seeded, CandidateTestData.education().build());

        mockMvc.perform(put("/v1/candidates/{id}/education/{eid}", seeded.candidateId(), educationId)
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                CandidateTestData.education().degree("PhD").institution("Stanford").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.degree").value("PhD"))
                .andExpect(jsonPath("$.institution").value("Stanford"));
    }

    @Test
    @DisplayName("shouldDeleteEducation")
    void shouldDeleteEducation() throws Exception {
        Seeded seeded = seedCandidate();
        long educationId = addEducation(seeded, CandidateTestData.education().build());

        mockMvc.perform(delete("/v1/candidates/{id}/education/{eid}", seeded.candidateId(), educationId)
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/v1/candidates/{id}/education", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("shouldReturn422_WhenDegreeMissing")
    void shouldReturn422_WhenDegreeMissing() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/education", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.education().degree("").build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("shouldReturn401_WhenNotAuthenticated")
    void shouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/v1/candidates/{id}/education", 1L))
                .andExpect(status().isUnauthorized());
    }
}
