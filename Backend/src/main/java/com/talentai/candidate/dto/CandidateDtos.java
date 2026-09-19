package com.talentai.candidate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/** Candidate-domain request/response DTOs, grouped to keep the domain surface compact. */
public final class CandidateDtos {

    private CandidateDtos() {
    }

    // --- Profile ---
    public record CreateCandidateRequest(
            @NotNull(message = "userId is required") Long userId,
            String phone,
            String location) {
    }

    public record CandidateProfileResponse(
            Long candidateId,
            String name,
            String email,
            String location,
            List<String> skills,
            BigDecimal experience,
            String education,
            String resumeUrl,
            String phone,
            String noticePeriod,
            BigDecimal salaryExpectation) {
    }

    public record UpdateCandidateRequest(
            String location,
            String noticePeriod,
            BigDecimal salaryExpectation) {
    }

    public record CandidateMessageResponse(Long candidateId, String message) {
    }

    /** A single row in the recruiter candidate-search results. */
    public record CandidateSearchResult(
            Long candidateId,
            String name,
            String email,
            String location,
            BigDecimal experience,
            List<String> skills) {
    }

    // --- Skills ---
    public record SkillsResponse(Long candidateId, List<String> skills) {
    }

    public record UpdateSkillsRequest(@NotNull(message = "skills is required") List<String> skills) {
    }

    // --- Education ---
    public record EducationRequest(
            @NotBlank(message = "degree is required") String degree,
            String institution,
            String fieldOfStudy,
            Integer startYear,
            Integer endYear) {
    }

    public record EducationResponse(
            Long educationId,
            String degree,
            String institution,
            String fieldOfStudy,
            Integer startYear,
            Integer endYear) {
    }

    // --- Work experience ---
    public record WorkExperienceRequest(
            @NotBlank(message = "companyName is required") String companyName,
            @NotBlank(message = "jobTitle is required") String jobTitle,
            String startDate,
            String endDate,
            Boolean isCurrent,
            String description) {
    }

    public record WorkExperienceResponse(
            Long workExperienceId,
            String companyName,
            String jobTitle,
            String startDate,
            String endDate,
            Boolean isCurrent,
            String description) {
    }

    // --- Certifications ---
    public record CertificationRequest(
            @NotBlank(message = "name is required") String name,
            String issuer,
            String issueDate) {
    }

    public record CertificationResponse(Long certificationId, String name, String issuer, String issueDate) {
    }

    // --- Resume ---
    public record ResumeUploadResponse(Long resumeId, String fileName, String status) {
    }

    public record ResumeParseExtracted(
            List<String> skills,
            BigDecimal experience,
            String education,
            List<String> certifications,
            List<String> companies) {
    }

    public record ResumeParseResponse(Long candidateId, ResumeParseExtracted extracted, String status) {
    }
}
