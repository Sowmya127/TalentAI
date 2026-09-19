package com.talentai.report.integration;

import com.talentai.application.entity.Application;
import com.talentai.application.repository.ApplicationRepository;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import com.talentai.common.enums.RoleName;
import com.talentai.job.entity.Job;
import com.talentai.job.repository.JobRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full-stack tests for the hiring-manager decision history report (JSON + CSV download). */
@DisplayName("HiringReportIT")
class HiringReportIT extends IntegrationTestBase {

    @Autowired private JobRepository jobRepository;
    @Autowired private ApplicationRepository applicationRepository;

    private String seedDecisionsAndReturnCandidateEmail() {
        long uid = registerUser();
        String email = userRepository.findById(uid).orElseThrow().getEmail();
        Candidate cand = candidateRepository.save(Candidate.builder()
                .userId(uid).currentLocation("Bengaluru").totalExperience(BigDecimal.ZERO)
                .createdBy(uid).isActive(true).build());
        // One application per job — uq_application_candidate_job forbids re-applying to the same job.
        saveApp(cand.getCandidateId(), newJob(uid), "Selected", uid);
        saveApp(cand.getCandidateId(), newJob(uid), "Selected", uid);
        saveApp(cand.getCandidateId(), newJob(uid), "Rejected", uid);
        return email;
    }

    private Long newJob(long recruiterId) {
        return jobRepository.save(Job.builder()
                .title("Backend Engineer").headcount(1).jobStatus("Open").recruiterId(recruiterId)
                .createdBy(recruiterId).isActive(true).build()).getJobId();
    }

    private void saveApp(Long candidateId, Long jobId, String statusValue, long actor) {
        applicationRepository.save(Application.builder()
                .candidateId(candidateId).jobId(jobId).applicationStatus(statusValue)
                .consentGiven(true).createdBy(actor).isActive(true).build());
    }

    private String hiringManagerToken() {
        long id = registerUser();
        grantRole(id, RoleName.HIRING_MANAGER);
        return bearer(id);
    }

    @Test
    @DisplayName("shouldReturnSelectedAndRejectedCounts")
    void shouldReturnSelectedAndRejectedCounts() throws Exception {
        seedDecisionsAndReturnCandidateEmail();

        mockMvc.perform(get("/v1/reports/hiring-decisions").param("days", "7")
                        .header("Authorization", hiringManagerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(7))
                .andExpect(jsonPath("$.selected", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.rejected", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.rows.length()", greaterThanOrEqualTo(3)));
    }

    @Test
    @DisplayName("shouldDownloadCsvWithHeaderAndRows")
    void shouldDownloadCsvWithHeaderAndRows() throws Exception {
        String email = seedDecisionsAndReturnCandidateEmail();

        MvcResult res = mockMvc.perform(get("/v1/reports/hiring-decisions/download").param("days", "7")
                        .header("Authorization", hiringManagerToken()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andReturn();

        String csv = res.getResponse().getContentAsString();
        assertThat(csv).contains("Decision Date,Candidate,Email,Job Title,Decision");
        assertThat(csv).contains(email);
        assertThat(csv).contains("Selected");
    }

    @Test
    @DisplayName("shouldReturn403_WhenCandidateRequestsReport")
    void shouldReturn403_WhenCandidateRequestsReport() throws Exception {
        long candidateUserId = registerUser();
        mockMvc.perform(get("/v1/reports/hiring-decisions").header("Authorization", bearer(candidateUserId)))
                .andExpect(status().isForbidden());
    }
}
