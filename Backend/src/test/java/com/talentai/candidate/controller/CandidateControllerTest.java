package com.talentai.candidate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentai.candidate.dto.CandidateDtos.*;
import com.talentai.candidate.service.CandidateService;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.security.UserPrincipal;
import com.talentai.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer tests for {@link CandidateController} using MockMvc. The service is
 * mocked; the app's real GlobalExceptionHandler (@RestControllerAdvice) is on
 * the classpath and is exercised for status-code mapping. Requests carry a
 * JWT-derived {@link UserPrincipal} via Spring Security's test post-processors.
 */
@WebMvcTest(CandidateController.class)
@DisplayName("CandidateController")
class CandidateControllerTest {

    private static final Long USER_ID = 101L;
    private static final Long CANDIDATE_ID = 201L;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private CandidateService candidateService;
    // The web slice auto-registers the JwtAuthenticationFilter (a Filter bean);
    // mock its collaborators so the slice context can build without the full app.
    @MockBean private com.talentai.security.JwtTokenProvider jwtTokenProvider;
    @MockBean private com.talentai.security.CustomUserDetailsService customUserDetailsService;
    // Object-level authorization guard referenced by @PreAuthorize on the controller.
    // The web slice does not scan @Component beans, so provide it as a mock and let
    // it allow access — ownership/role logic is covered by CandidateAccessGuard's own
    // and the integration tests.
    @MockBean private com.talentai.candidate.security.CandidateAccessGuard candidateAccessGuard;

    private CandidateProfileResponse profile;

    @BeforeEach
    void setUp() {
        profile = new CandidateProfileResponse(CANDIDATE_ID, "John Doe", "john@example.com", "Bengaluru",
                List.of("Java"), new BigDecimal("5.0"), "B.Tech", "/files/resumes/201.pdf",
                "+91-9000000000", "30 days", new BigDecimal("1800000"));
        when(candidateAccessGuard.canView(any(), any())).thenReturn(true);
        when(candidateAccessGuard.canModify(any(), any())).thenReturn(true);
    }

    /** Authenticated principal identical to what JwtAuthenticationFilter would set —
     *  populates the SecurityContext so both the filter chain and @AuthenticationPrincipal see it. */
    private RequestPostProcessor candidateAuth() {
        User u = User.builder().userId(USER_ID).firstName("John").lastName("Doe").email("john@example.com").build();
        UserPrincipal principal = new UserPrincipal(u, List.of(new SimpleGrantedAuthority("ROLE_CANDIDATE")));
        return authentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    // =====================================================================
    @Test
    @DisplayName("shouldReturnUnauthorized_WhenNoAuthentication")
    void shouldReturnUnauthorized_WhenNoAuthentication() throws Exception {
        // Act & Assert — security filter chain rejects anonymous access
        mockMvc.perform(get("/v1/candidates/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("shouldReturnProfile_WhenAuthenticatedGetMe")
    void shouldReturnProfile_WhenAuthenticatedGetMe() throws Exception {
        // Arrange
        when(candidateService.getMyProfile(USER_ID)).thenReturn(profile);

        // Act & Assert
        mockMvc.perform(get("/v1/candidates/me").with(candidateAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidateId").value(CANDIDATE_ID))
                .andExpect(jsonPath("$.name").value("John Doe"))
                .andExpect(jsonPath("$.skills[0]").value("Java"));
    }

    @Test
    @DisplayName("shouldReturnNotFound_WhenProfileMissing")
    void shouldReturnNotFound_WhenProfileMissing() throws Exception {
        // Arrange
        when(candidateService.getMyProfile(USER_ID)).thenThrow(new ResourceNotFoundException("No candidate profile found."));

        // Act & Assert
        mockMvc.perform(get("/v1/candidates/me").with(candidateAuth()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("shouldCreateCandidate_WhenRequestIsValid")
    void shouldCreateCandidate_WhenRequestIsValid() throws Exception {
        // Arrange
        when(candidateService.createProfile(any(CreateCandidateRequest.class), eq(USER_ID)))
                .thenReturn(new CandidateMessageResponse(CANDIDATE_ID, "Candidate profile created."));
        String body = objectMapper.writeValueAsString(new CreateCandidateRequest(USER_ID, "+91-9000000000", "Bengaluru"));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates").with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.candidateId").value(CANDIDATE_ID))
                .andExpect(jsonPath("$.message").value("Candidate profile created."));
    }

    @Test
    @DisplayName("shouldReturnUnprocessable_WhenUserIdMissing")
    void shouldReturnUnprocessable_WhenUserIdMissing() throws Exception {
        // Arrange — userId is @NotNull
        String body = objectMapper.writeValueAsString(new CreateCandidateRequest(null, "+91", "Bengaluru"));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates").with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("shouldReturnConflict_WhenDuplicateProfile")
    void shouldReturnConflict_WhenDuplicateProfile() throws Exception {
        // Arrange
        when(candidateService.createProfile(any(CreateCandidateRequest.class), eq(USER_ID)))
                .thenThrow(new DuplicateResourceException("A candidate profile already exists for this user."));
        String body = objectMapper.writeValueAsString(new CreateCandidateRequest(USER_ID, "+91", "Bengaluru"));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates").with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("shouldUpdateProfileSuccessfully")
    void shouldUpdateProfileSuccessfully() throws Exception {
        // Arrange
        when(candidateService.updateProfile(eq(CANDIDATE_ID), any(UpdateCandidateRequest.class), eq(USER_ID)))
                .thenReturn(new CandidateMessageResponse(CANDIDATE_ID, "Profile updated successfully."));
        String body = objectMapper.writeValueAsString(new UpdateCandidateRequest("Hyderabad", "60 days", new BigDecimal("2000000")));

        // Act & Assert
        mockMvc.perform(put("/v1/candidates/{id}", CANDIDATE_ID).with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Profile updated successfully."));
    }

    @Test
    @DisplayName("shouldReturnSkills")
    void shouldReturnSkills() throws Exception {
        // Arrange
        when(candidateService.getSkills(CANDIDATE_ID)).thenReturn(new SkillsResponse(CANDIDATE_ID, List.of("Java", "SQL")));

        // Act & Assert
        mockMvc.perform(get("/v1/candidates/{id}/skills", CANDIDATE_ID).with(candidateAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills.length()").value(2));
    }

    @Test
    @DisplayName("shouldUpdateSkills")
    void shouldUpdateSkills() throws Exception {
        // Arrange
        when(candidateService.updateSkills(eq(CANDIDATE_ID), any(), eq(USER_ID)))
                .thenReturn(new SkillsResponse(CANDIDATE_ID, List.of("Java")));
        String body = objectMapper.writeValueAsString(new UpdateSkillsRequest(List.of("Java")));

        // Act & Assert
        mockMvc.perform(put("/v1/candidates/{id}/skills", CANDIDATE_ID).with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills[0]").value("Java"));
    }

    @Test
    @DisplayName("shouldAddEducation")
    void shouldAddEducation() throws Exception {
        // Arrange
        when(candidateService.addEducation(eq(CANDIDATE_ID), any(EducationRequest.class), eq(USER_ID)))
                .thenReturn(new EducationResponse(500L, "B.Tech", "IIT", null, null, 2020));
        String body = objectMapper.writeValueAsString(new EducationRequest("B.Tech", "IIT", "CS", 2016, 2020));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates/{id}/education", CANDIDATE_ID).with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.educationId").value(500))
                .andExpect(jsonPath("$.endYear").value(2020));
    }

    @Test
    @DisplayName("shouldReturnUnprocessable_WhenEducationDegreeBlank")
    void shouldReturnUnprocessable_WhenEducationDegreeBlank() throws Exception {
        // Arrange — degree is @NotBlank
        String body = objectMapper.writeValueAsString(new EducationRequest("", "IIT", "CS", 2016, 2020));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates/{id}/education", CANDIDATE_ID).with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("shouldDeleteEducation_ReturningNoContent")
    void shouldDeleteEducation_ReturningNoContent() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/v1/candidates/{id}/education/{eduId}", CANDIDATE_ID, 500L).with(candidateAuth()).with(csrf()))
                .andExpect(status().isNoContent());
        verify(candidateService).deleteEducation(CANDIDATE_ID, 500L);
    }

    @Test
    @DisplayName("shouldAddCertification")
    void shouldAddCertification() throws Exception {
        // Arrange
        when(candidateService.addCertification(eq(CANDIDATE_ID), any(CertificationRequest.class), eq(USER_ID)))
                .thenReturn(new CertificationResponse(900L, "AWS", "Amazon", "2024-03-15"));
        String body = objectMapper.writeValueAsString(new CertificationRequest("AWS", "Amazon", "2024-03-15"));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates/{id}/certifications", CANDIDATE_ID).with(candidateAuth()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.certificationId").value(900));
    }

    @Test
    @DisplayName("shouldUploadResume")
    void shouldUploadResume() throws Exception {
        // Arrange
        when(candidateService.uploadResume(eq(CANDIDATE_ID), any(), eq(USER_ID)))
                .thenReturn(new ResumeUploadResponse(CANDIDATE_ID, "cv.pdf", "Uploaded"));
        MockMultipartFile file = new MockMultipartFile("resume", "cv.pdf", "application/pdf", "cv".getBytes());

        // Act & Assert
        mockMvc.perform(multipart("/v1/candidates/{id}/resume", CANDIDATE_ID).file(file)
                        .with(candidateAuth()).with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("Uploaded"));
    }

    @Test
    @DisplayName("shouldParseResume")
    void shouldParseResume() throws Exception {
        // Arrange
        when(candidateService.parseResume(CANDIDATE_ID)).thenReturn(new ResumeParseResponse(CANDIDATE_ID,
                new ResumeParseExtracted(List.of("Java"), new BigDecimal("5.0"), "B.Tech", List.of(), List.of()),
                "PendingReview"));

        // Act & Assert
        mockMvc.perform(post("/v1/candidates/{id}/resume/parse", CANDIDATE_ID).with(candidateAuth()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PendingReview"))
                .andExpect(jsonPath("$.extracted.skills[0]").value("Java"));
    }
}
