package com.talentai.candidate.integration;

import com.talentai.candidate.integration.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Resume upload + parse integration tests.
 *
 * <p><b>Documented gap.</b> The upload endpoint performs NO content-type or file
 * size validation in the service, so "invalid format" / "oversized file" are
 * accepted (201). The test named {@code _noValidationDocumented} captures that;
 * add validation in {@code CandidateService.uploadResume} to tighten it.
 */
@DisplayName("CandidateResumeIT")
class CandidateResumeIT extends IntegrationTestBase {

    @Test
    @DisplayName("shouldUploadResume_WhenValidPdf")
    void shouldUploadResume_WhenValidPdf() throws Exception {
        Seeded seeded = seedCandidate();
        MockMultipartFile file = new MockMultipartFile("resume", "cv.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        mockMvc.perform(multipart("/v1/candidates/{id}/resume", seeded.candidateId())
                        .file(file).header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("cv.pdf"))
                .andExpect(jsonPath("$.status").value("Uploaded"));
    }

    @Test
    @DisplayName("shouldAcceptResume_RegardlessOfFormat_noValidationDocumented")
    void shouldAcceptResume_RegardlessOfFormat_noValidationDocumented() throws Exception {
        Seeded seeded = seedCandidate();
        MockMultipartFile file = new MockMultipartFile("resume", "notes.txt", "text/plain", "just text".getBytes());

        mockMvc.perform(multipart("/v1/candidates/{id}/resume", seeded.candidateId())
                        .file(file).header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("Uploaded"));
    }

    @Test
    @DisplayName("shouldParseResume_ReturningPendingReview")
    void shouldParseResume_ReturningPendingReview() throws Exception {
        Seeded seeded = seedCandidate();

        mockMvc.perform(post("/v1/candidates/{id}/resume/parse", seeded.candidateId())
                        .header("Authorization", bearer(seeded.userId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value((int) seeded.candidateId()))
                .andExpect(jsonPath("$.status").value("PendingReview"))
                .andExpect(jsonPath("$.extracted").exists());
    }

    @Test
    @DisplayName("shouldReturn404_WhenUploadingForUnknownCandidate")
    void shouldReturn404_WhenUploadingForUnknownCandidate() throws Exception {
        long userId = registerUser();
        MockMultipartFile file = new MockMultipartFile("resume", "cv.pdf", "application/pdf", "x".getBytes());

        mockMvc.perform(multipart("/v1/candidates/{id}/resume", 9_999_999L)
                        .file(file).header("Authorization", bearer(userId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("shouldReturn401_WhenUploadingWithoutAuth")
    void shouldReturn401_WhenUploadingWithoutAuth() throws Exception {
        MockMultipartFile file = new MockMultipartFile("resume", "cv.pdf", "application/pdf", "x".getBytes());

        mockMvc.perform(multipart("/v1/candidates/{id}/resume", 1L).file(file))
                .andExpect(status().isUnauthorized());
    }
}
