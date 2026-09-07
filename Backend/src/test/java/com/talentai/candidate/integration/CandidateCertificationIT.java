package com.talentai.candidate.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.talentai.candidate.dto.CandidateDtos.CertificationRequest;
import com.talentai.candidate.integration.support.CandidateTestData;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Certification CRUD integration tests (full stack, real MySQL). */
@DisplayName("CandidateCertificationIT")
class CandidateCertificationIT extends IntegrationTestBase {

    private long addCert(Seeded seeded, CertificationRequest body) throws Exception {
        String json = mockMvc.perform(post("/v1/candidates/{id}/certifications", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(json);
        return node.get("certificationId").asLong();
    }

    @Test
    @DisplayName("shouldAddCertification_WhenValidRequest")
    void shouldAddCertification_WhenValidRequest() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/certifications", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CandidateTestData.certification())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.certificationId").isNumber())
                .andExpect(jsonPath("$.name").value("AWS Certified Solutions Architect"))
                .andExpect(jsonPath("$.issuer").value("Amazon Web Services"));
    }

    @Test
    @DisplayName("shouldListCertifications")
    void shouldListCertifications() throws Exception {
        Seeded seeded = seedCandidate();
        addCert(seeded, CandidateTestData.certification("CKA"));

        mockMvc.perform(get("/v1/candidates/{id}/certifications", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("CKA"));
    }

    @Test
    @DisplayName("shouldDeleteCertification")
    void shouldDeleteCertification() throws Exception {
        Seeded seeded = seedCandidate();
        long id = addCert(seeded, CandidateTestData.certification());

        mockMvc.perform(delete("/v1/candidates/{id}/certifications/{cid}", seeded.candidateId(), id)
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/v1/candidates/{id}/certifications", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("shouldReturn422_WhenCertificationNameMissing")
    void shouldReturn422_WhenCertificationNameMissing() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/certifications", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CertificationRequest("", "Issuer", "2024-01-01"))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }
}
