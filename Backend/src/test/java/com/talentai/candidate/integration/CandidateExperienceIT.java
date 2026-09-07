package com.talentai.candidate.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.talentai.candidate.dto.CandidateDtos.WorkExperienceRequest;
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

/** Work-experience CRUD integration tests (full stack, real MySQL). */
@DisplayName("CandidateExperienceIT")
class CandidateExperienceIT extends IntegrationTestBase {

    private long addWork(Seeded seeded, WorkExperienceRequest body) throws Exception {
        String json = mockMvc.perform(post("/v1/candidates/{id}/work-experience", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(json);
        return node.get("workExperienceId").asLong();
    }

    @Test
    @DisplayName("shouldAddWorkExperience_WhenValidRequest")
    void shouldAddWorkExperience_WhenValidRequest() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/work-experience", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.work().build())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.workExperienceId").isNumber())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.jobTitle").value("Software Engineer"));
    }

    @Test
    @DisplayName("shouldMarkCurrentRole_WhenIsCurrentTrue")
    void shouldMarkCurrentRole_WhenIsCurrentTrue() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/work-experience", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                CandidateTestData.work().current(true).endDate(null).build())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isCurrent").value(true))
                .andExpect(jsonPath("$.endDate").doesNotExist());
    }

    @Test
    @DisplayName("shouldListWorkExperience")
    void shouldListWorkExperience() throws Exception {
        Seeded seeded = seedCandidate();
        addWork(seeded, CandidateTestData.work().companyName("Globex").build());

        mockMvc.perform(get("/v1/candidates/{id}/work-experience", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].companyName").value("Globex"));
    }

    @Test
    @DisplayName("shouldUpdateWorkExperience")
    void shouldUpdateWorkExperience() throws Exception {
        Seeded seeded = seedCandidate();
        long id = addWork(seeded, CandidateTestData.work().build());

        mockMvc.perform(put("/v1/candidates/{id}/work-experience/{wid}", seeded.candidateId(), id)
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                CandidateTestData.work().jobTitle("Senior Engineer").companyName("Initech").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").value("Senior Engineer"))
                .andExpect(jsonPath("$.companyName").value("Initech"));
    }

    @Test
    @DisplayName("shouldDeleteWorkExperience")
    void shouldDeleteWorkExperience() throws Exception {
        Seeded seeded = seedCandidate();
        long id = addWork(seeded, CandidateTestData.work().build());

        mockMvc.perform(delete("/v1/candidates/{id}/work-experience/{wid}", seeded.candidateId(), id)
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/v1/candidates/{id}/work-experience", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("shouldReturn422_WhenCompanyNameMissing")
    void shouldReturn422_WhenCompanyNameMissing() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/work-experience", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.work().companyName("").build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }
}
