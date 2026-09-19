package com.talentai.candidate.integration;

import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import com.talentai.common.enums.RoleName;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full-stack tests for recruiter candidate search + soft-delete and their authorization. */
@DisplayName("CandidateSearchDeleteIT")
class CandidateSearchDeleteIT extends IntegrationTestBase {

    /** Seeds an active candidate (with a real user, so name/email resolve) at a location/experience. */
    private Candidate seedAt(String location, String experience) {
        long uid = registerUser();
        return candidateRepository.save(Candidate.builder()
                .userId(uid).currentLocation(location).totalExperience(new BigDecimal(experience))
                .createdBy(uid).isActive(true).build());
    }

    private String recruiterToken() {
        long id = registerUser();
        grantRole(id, RoleName.RECRUITER);
        return bearer(id);
    }

    @Test
    @DisplayName("shouldLetRecruiterSearchByLocation")
    void shouldLetRecruiterSearchByLocation() throws Exception {
        String city = "SearchCity" + UUID.randomUUID().toString().substring(0, 8);
        seedAt(city, "5");
        seedAt("Elsewhere" + UUID.randomUUID().toString().substring(0, 8), "2");

        mockMvc.perform(get("/v1/candidates/search")
                        .param("location", city)
                        .header("Authorization", recruiterToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords").value(1))
                .andExpect(jsonPath("$.data[0].location").value(city))
                .andExpect(jsonPath("$.data[0].name").value("Test Candidate"));
    }

    @Test
    @DisplayName("shouldFilterByMinimumExperience")
    void shouldFilterByMinimumExperience() throws Exception {
        String city = "ExpCity" + UUID.randomUUID().toString().substring(0, 8);
        seedAt(city, "8");
        seedAt(city, "1");

        mockMvc.perform(get("/v1/candidates/search")
                        .param("location", city).param("minExperience", "5")
                        .header("Authorization", recruiterToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords").value(1))
                .andExpect(jsonPath("$.data[0].experience").value(8.0));
    }

    @Test
    @DisplayName("shouldReturn403_WhenCandidateSearches")
    void shouldReturn403_WhenCandidateSearches() throws Exception {
        long candidateUserId = registerUser(); // Candidate role only
        mockMvc.perform(get("/v1/candidates/search").header("Authorization", bearer(candidateUserId)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("shouldLetRecruiterDeleteCandidate_ThenExcludeFromSearch")
    void shouldLetRecruiterDeleteCandidate_ThenExcludeFromSearch() throws Exception {
        String city = "DelCity" + UUID.randomUUID().toString().substring(0, 8);
        Candidate c = seedAt(city, "5");
        String recruiter = recruiterToken();

        mockMvc.perform(delete("/v1/candidates/{id}", c.getCandidateId()).header("Authorization", recruiter))
                .andExpect(status().isNoContent());

        // Soft-deleted -> no longer returned by search.
        mockMvc.perform(get("/v1/candidates/search").param("location", city).header("Authorization", recruiter))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords").value(0));
    }

    @Test
    @DisplayName("shouldReturn403_WhenCandidateDeletes")
    void shouldReturn403_WhenCandidateDeletes() throws Exception {
        Candidate c = seedAt("NoDelete" + UUID.randomUUID().toString().substring(0, 8), "3");
        long candidateUserId = registerUser();
        mockMvc.perform(delete("/v1/candidates/{id}", c.getCandidateId()).header("Authorization", bearer(candidateUserId)))
                .andExpect(status().isForbidden());
    }
}
