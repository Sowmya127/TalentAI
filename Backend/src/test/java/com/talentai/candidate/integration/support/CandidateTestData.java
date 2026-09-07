package com.talentai.candidate.integration.support;

import com.talentai.candidate.dto.CandidateDtos.CertificationRequest;
import com.talentai.candidate.dto.CandidateDtos.CreateCandidateRequest;
import com.talentai.candidate.dto.CandidateDtos.EducationRequest;
import com.talentai.candidate.dto.CandidateDtos.UpdateCandidateRequest;
import com.talentai.candidate.dto.CandidateDtos.UpdateSkillsRequest;
import com.talentai.candidate.dto.CandidateDtos.WorkExperienceRequest;

import java.math.BigDecimal;
import java.util.List;

/**
 * Test-data builders for candidate request payloads. The production DTOs are
 * immutable records, so these provide sensible defaults plus tiny fluent
 * builders for the cases where a test needs to vary one field.
 */
public final class CandidateTestData {

    private CandidateTestData() {
    }

    public static CreateCandidateRequest createCandidate(long userId) {
        return new CreateCandidateRequest(userId, "+91-9000000000", "Bengaluru");
    }

    public static UpdateCandidateRequest updateCandidate() {
        return new UpdateCandidateRequest("Hyderabad", "60 days", new BigDecimal("2000000"));
    }

    public static UpdateSkillsRequest skills(String... names) {
        return new UpdateSkillsRequest(List.of(names));
    }

    // --- Education ---
    public static EducationBuilder education() {
        return new EducationBuilder();
    }

    public static final class EducationBuilder {
        private String degree = "B.Tech";
        private String institution = "MIT";
        private String fieldOfStudy = "Computer Science";
        private Integer startYear = 2016;
        private Integer endYear = 2020;

        public EducationBuilder degree(String v) { this.degree = v; return this; }
        public EducationBuilder institution(String v) { this.institution = v; return this; }
        public EducationBuilder fieldOfStudy(String v) { this.fieldOfStudy = v; return this; }
        public EducationBuilder startYear(Integer v) { this.startYear = v; return this; }
        public EducationBuilder endYear(Integer v) { this.endYear = v; return this; }

        public EducationRequest build() {
            return new EducationRequest(degree, institution, fieldOfStudy, startYear, endYear);
        }
    }

    // --- Work experience ---
    public static WorkExperienceBuilder work() {
        return new WorkExperienceBuilder();
    }

    public static final class WorkExperienceBuilder {
        private String companyName = "Acme Corp";
        private String jobTitle = "Software Engineer";
        private String startDate = "2020-01-01";
        private String endDate = "2023-01-01";
        private Boolean isCurrent = false;
        private String description = "Built things.";

        public WorkExperienceBuilder companyName(String v) { this.companyName = v; return this; }
        public WorkExperienceBuilder jobTitle(String v) { this.jobTitle = v; return this; }
        public WorkExperienceBuilder startDate(String v) { this.startDate = v; return this; }
        public WorkExperienceBuilder endDate(String v) { this.endDate = v; return this; }
        public WorkExperienceBuilder current(boolean v) { this.isCurrent = v; return this; }
        public WorkExperienceBuilder description(String v) { this.description = v; return this; }

        public WorkExperienceRequest build() {
            return new WorkExperienceRequest(companyName, jobTitle, startDate, endDate, isCurrent, description);
        }
    }

    // --- Certifications ---
    public static CertificationRequest certification() {
        return new CertificationRequest("AWS Certified Solutions Architect", "Amazon Web Services", "2024-03-15");
    }

    public static CertificationRequest certification(String name) {
        return new CertificationRequest(name, "Issuer", "2024-01-01");
    }
}
