package com.talentai.candidate.dto;

import com.talentai.candidate.dto.CandidateDtos.*;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The Candidate module has no dedicated validator class — request validation is
 * declared with Jakarta Bean Validation annotations on the DTO records and
 * enforced by @Valid in the controller. This test drives that real validation
 * layer directly. (Email/phone-format validation is not part of the Candidate
 * DTOs — the candidate create request carries userId/phone/location, and email
 * validation lives on the auth/user registration DTOs instead.)
 */
@DisplayName("Candidate DTO validation")
class CandidateRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void init() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private <T> Set<ConstraintViolation<T>> validate(T obj) {
        return validator.validate(obj);
    }

    // ---------- CreateCandidateRequest ----------

    @Test
    @DisplayName("shouldPass_WhenCreateRequestValid")
    void shouldPass_WhenCreateRequestValid() {
        // Arrange
        CreateCandidateRequest req = new CreateCandidateRequest(101L, "+91-9000000000", "Bengaluru");
        // Act
        var violations = validate(req);
        // Assert
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("shouldFail_WhenUserIdIsNull")
    void shouldFail_WhenUserIdIsNull() {
        // Arrange
        CreateCandidateRequest req = new CreateCandidateRequest(null, "+91", "Bengaluru");
        // Act
        var violations = validate(req);
        // Assert
        assertThat(violations).extracting(ConstraintViolation::getMessage).contains("userId is required");
    }

    // ---------- UpdateSkillsRequest ----------

    @Test
    @DisplayName("shouldFail_WhenSkillsListIsNull")
    void shouldFail_WhenSkillsListIsNull() {
        // Arrange
        UpdateSkillsRequest req = new UpdateSkillsRequest(null);
        // Act
        var violations = validate(req);
        // Assert
        assertThat(violations).extracting(ConstraintViolation::getMessage).contains("skills is required");
    }

    @Test
    @DisplayName("shouldPass_WhenSkillsListPresent")
    void shouldPass_WhenSkillsListPresent() {
        // Arrange
        UpdateSkillsRequest req = new UpdateSkillsRequest(List.of("Java"));
        // Act & Assert
        assertThat(validate(req)).isEmpty();
    }

    // ---------- EducationRequest ----------

    @Test
    @DisplayName("shouldFail_WhenDegreeBlank")
    void shouldFail_WhenDegreeBlank() {
        // Arrange
        EducationRequest req = new EducationRequest("  ", "IIT", "CS", 2016, 2020);
        // Act
        var violations = validate(req);
        // Assert
        assertThat(violations).extracting(ConstraintViolation::getMessage).contains("degree is required");
    }

    @Test
    @DisplayName("shouldPass_WhenEducationValid")
    void shouldPass_WhenEducationValid() {
        // Arrange
        EducationRequest req = new EducationRequest("B.Tech", "IIT", "CS", 2016, 2020);
        // Act & Assert
        assertThat(validate(req)).isEmpty();
    }

    // ---------- WorkExperienceRequest ----------

    @Test
    @DisplayName("shouldFail_WhenCompanyNameAndJobTitleBlank")
    void shouldFail_WhenCompanyNameAndJobTitleBlank() {
        // Arrange
        WorkExperienceRequest req = new WorkExperienceRequest("", "", "2020-01-01", null, true, null);
        // Act
        var violations = validate(req);
        // Assert
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("companyName is required", "jobTitle is required");
    }

    @Test
    @DisplayName("shouldPass_WhenWorkExperienceValid")
    void shouldPass_WhenWorkExperienceValid() {
        // Arrange
        WorkExperienceRequest req = new WorkExperienceRequest("Infosys", "Engineer", "2020-01-01", "2022-01-01", false, "work");
        // Act & Assert
        assertThat(validate(req)).isEmpty();
    }

    // ---------- CertificationRequest ----------

    @Test
    @DisplayName("shouldFail_WhenCertificationNameBlank")
    void shouldFail_WhenCertificationNameBlank() {
        // Arrange
        CertificationRequest req = new CertificationRequest("", "AWS", "2024-03-15");
        // Act
        var violations = validate(req);
        // Assert
        assertThat(violations).extracting(ConstraintViolation::getMessage).contains("name is required");
    }

    @Test
    @DisplayName("shouldPass_WhenCertificationValid")
    void shouldPass_WhenCertificationValid() {
        // Arrange
        CertificationRequest req = new CertificationRequest("AWS Certified Developer", "AWS", "2024-03-15");
        // Act & Assert
        assertThat(validate(req)).isEmpty();
    }

    // ---------- UpdateCandidateRequest (no constraints — all optional) ----------

    @Test
    @DisplayName("shouldPass_WhenUpdateRequestAllNull")
    void shouldPass_WhenUpdateRequestAllNull() {
        // Arrange
        UpdateCandidateRequest req = new UpdateCandidateRequest(null, null, (BigDecimal) null);
        // Act & Assert
        assertThat(validate(req)).isEmpty();
    }
}
