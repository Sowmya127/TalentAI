package com.talentai.candidate.service;

import com.talentai.candidate.dto.CandidateDtos.*;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.entity.CandidateSkill;
import com.talentai.candidate.entity.Certification;
import com.talentai.candidate.entity.Education;
import com.talentai.candidate.entity.WorkExperience;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.candidate.repository.CandidateSkillRepository;
import com.talentai.candidate.repository.CertificationRepository;
import com.talentai.candidate.repository.EducationRepository;
import com.talentai.candidate.repository.WorkExperienceRepository;
import com.talentai.common.exception.BusinessException;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.skill.entity.Skill;
import com.talentai.skill.repository.SkillRepository;
import com.talentai.skill.service.SkillService;
import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link CandidateService}. The service holds all Candidate-module
 * business logic AND the inline entity->DTO mapping (there is no separate
 * mapper class), so mapping behaviour — null handling, collection mapping,
 * field translation (e.g. graduationYear -> endYear) — is asserted here too.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CandidateService")
class CandidateServiceTest {

    private static final Long USER_ID = 101L;
    private static final Long CANDIDATE_ID = 201L;
    private static final Long ACTOR_ID = 1L;
    private static final Integer SKILL_ID = 10;

    @Mock private CandidateRepository candidateRepository;
    @Mock private CandidateSkillRepository candidateSkillRepository;
    @Mock private EducationRepository educationRepository;
    @Mock private WorkExperienceRepository workExperienceRepository;
    @Mock private CertificationRepository certificationRepository;
    @Mock private SkillRepository skillRepository;
    @Mock private SkillService skillService;
    @Mock private UserRepository userRepository;
    @Mock private com.talentai.audit.service.AuditService auditService;

    @InjectMocks private CandidateService candidateService;

    private User user;
    private Candidate candidate;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .userId(USER_ID).firstName("John").lastName("Doe")
                .email("john@example.com").phoneNumber("+91-9000000000")
                .userStatus("Active").isActive(true).build();
        candidate = Candidate.builder()
                .candidateId(CANDIDATE_ID).userId(USER_ID).currentLocation("Bengaluru")
                .totalExperience(new BigDecimal("5.0")).noticePeriodDays(30)
                .salaryExpectation(new BigDecimal("1800000")).resumeUrl("/files/resumes/201.pdf")
                .isActive(true).build();
    }

    // ---------- Test data builders ----------

    private CreateCandidateRequest createRequest() {
        return new CreateCandidateRequest(USER_ID, "+91-9000000000", "Bengaluru");
    }

    private Skill skill(String name) {
        return Skill.builder().skillId(SKILL_ID).skillName(name).isActive(true).build();
    }

    private CandidateSkill candidateSkillLink() {
        return CandidateSkill.builder().candidateSkillId(1L).candidateId(CANDIDATE_ID)
                .skillId(SKILL_ID).yearsExperience(BigDecimal.ZERO).isActive(true).build();
    }

    // =====================================================================
    @Nested
    @DisplayName("createProfile")
    class CreateProfile {

        @Test
        @DisplayName("shouldCreateCandidate_WhenRequestIsValid")
        void shouldCreateCandidate_WhenRequestIsValid() {
            // Arrange
            when(candidateRepository.existsByUserId(USER_ID)).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(candidateRepository.save(any(Candidate.class))).thenAnswer(inv -> {
                Candidate c = inv.getArgument(0);
                c.setCandidateId(CANDIDATE_ID);
                return c;
            });

            // Act
            CandidateMessageResponse response = candidateService.createProfile(createRequest(), ACTOR_ID);

            // Assert
            assertThat(response.candidateId()).isEqualTo(CANDIDATE_ID);
            assertThat(response.message()).isEqualTo("Candidate profile created.");
            ArgumentCaptor<Candidate> captor = ArgumentCaptor.forClass(Candidate.class);
            verify(candidateRepository).save(captor.capture());
            Candidate saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getCurrentLocation()).isEqualTo("Bengaluru");
            assertThat(saved.getTotalExperience()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(saved.getCreatedBy()).isEqualTo(ACTOR_ID);
            assertThat(saved.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("shouldUpdateUserPhone_WhenPhoneProvided")
        void shouldUpdateUserPhone_WhenPhoneProvided() {
            // Arrange
            when(candidateRepository.existsByUserId(USER_ID)).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

            // Act
            candidateService.createProfile(new CreateCandidateRequest(USER_ID, "+91-1112223334", "Pune"), ACTOR_ID);

            // Assert
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getPhoneNumber()).isEqualTo("+91-1112223334");
        }

        @Test
        @DisplayName("shouldNotUpdateUser_WhenPhoneIsBlank")
        void shouldNotUpdateUser_WhenPhoneIsBlank() {
            // Arrange
            when(candidateRepository.existsByUserId(USER_ID)).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

            // Act
            candidateService.createProfile(new CreateCandidateRequest(USER_ID, "  ", "Pune"), ACTOR_ID);

            // Assert
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("shouldThrowDuplicate_WhenProfileAlreadyExistsForUser")
        void shouldThrowDuplicate_WhenProfileAlreadyExistsForUser() {
            // Arrange
            when(candidateRepository.existsByUserId(USER_ID)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> candidateService.createProfile(createRequest(), ACTOR_ID))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("already exists");
            verify(candidateRepository, never()).save(any());
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenUserDoesNotExist")
        void shouldThrowNotFound_WhenUserDoesNotExist() {
            // Arrange
            when(candidateRepository.existsByUserId(USER_ID)).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.createProfile(createRequest(), ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
            verify(candidateRepository, never()).save(any());
        }

        @Test
        @DisplayName("shouldPropagate_WhenRepositoryThrowsUnexpectedException")
        void shouldPropagate_WhenRepositoryThrowsUnexpectedException() {
            // Arrange
            when(candidateRepository.existsByUserId(USER_ID)).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(candidateRepository.save(any(Candidate.class))).thenThrow(new RuntimeException("DB down"));

            // Act & Assert
            assertThatThrownBy(() -> candidateService.createProfile(createRequest(), ACTOR_ID))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("DB down");
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("getMyProfile / getProfile")
    class GetProfile {

        @Test
        @DisplayName("shouldReturnProfile_WhenCandidateExistsForUser")
        void shouldReturnProfile_WhenCandidateExistsForUser() {
            // Arrange
            when(candidateRepository.findByUserId(USER_ID)).thenReturn(Optional.of(candidate));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(candidateSkillRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());
            when(educationRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());

            // Act
            CandidateProfileResponse response = candidateService.getMyProfile(USER_ID);

            // Assert
            assertThat(response.candidateId()).isEqualTo(CANDIDATE_ID);
            assertThat(response.name()).isEqualTo("John Doe");
            assertThat(response.email()).isEqualTo("john@example.com");
            assertThat(response.location()).isEqualTo("Bengaluru");
            assertThat(response.noticePeriod()).isEqualTo("30 days");
            assertThat(response.skills()).isEmpty();
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenNoProfileForUser")
        void shouldThrowNotFound_WhenNoProfileForUser() {
            // Arrange
            when(candidateRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.getMyProfile(USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("shouldMapNamesEmpty_WhenUserRecordMissing")
        void shouldMapNamesEmpty_WhenUserRecordMissing() {
            // Arrange — candidate exists but the linked user row is gone (null-mapping path)
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
            when(candidateSkillRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());
            when(educationRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());

            // Act
            CandidateProfileResponse response = candidateService.getProfile(CANDIDATE_ID);

            // Assert
            assertThat(response.name()).isEmpty();
            assertThat(response.email()).isEmpty();
            assertThat(response.phone()).isNull();
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenCandidateIdUnknown")
        void shouldThrowNotFound_WhenCandidateIdUnknown() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.getProfile(CANDIDATE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Candidate not found");
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("updateProfile")
    class UpdateProfile {

        @Test
        @DisplayName("shouldUpdateCandidateSuccessfully")
        void shouldUpdateCandidateSuccessfully() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);
            UpdateCandidateRequest req = new UpdateCandidateRequest("Hyderabad", "60 days", new BigDecimal("2000000"));

            // Act
            CandidateMessageResponse response = candidateService.updateProfile(CANDIDATE_ID, req, ACTOR_ID);

            // Assert
            assertThat(response.message()).isEqualTo("Profile updated successfully.");
            ArgumentCaptor<Candidate> captor = ArgumentCaptor.forClass(Candidate.class);
            verify(candidateRepository).save(captor.capture());
            Candidate saved = captor.getValue();
            assertThat(saved.getCurrentLocation()).isEqualTo("Hyderabad");
            assertThat(saved.getNoticePeriodDays()).isEqualTo(60);
            assertThat(saved.getSalaryExpectation()).isEqualByComparingTo("2000000");
            assertThat(saved.getModifiedBy()).isEqualTo(ACTOR_ID);
        }

        @Test
        @DisplayName("shouldParseLeadingIntFromNoticePeriodString")
        void shouldParseLeadingIntFromNoticePeriodString() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

            // Act
            candidateService.updateProfile(CANDIDATE_ID, new UpdateCandidateRequest(null, "45 days notice", null), ACTOR_ID);

            // Assert
            ArgumentCaptor<Candidate> captor = ArgumentCaptor.forClass(Candidate.class);
            verify(candidateRepository).save(captor.capture());
            assertThat(captor.getValue().getNoticePeriodDays()).isEqualTo(45);
        }

        @Test
        @DisplayName("shouldLeaveFieldsUnchanged_WhenRequestFieldsAreNull")
        void shouldLeaveFieldsUnchanged_WhenRequestFieldsAreNull() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

            // Act
            candidateService.updateProfile(CANDIDATE_ID, new UpdateCandidateRequest(null, null, null), ACTOR_ID);

            // Assert — original values retained
            ArgumentCaptor<Candidate> captor = ArgumentCaptor.forClass(Candidate.class);
            verify(candidateRepository).save(captor.capture());
            assertThat(captor.getValue().getCurrentLocation()).isEqualTo("Bengaluru");
            assertThat(captor.getValue().getNoticePeriodDays()).isEqualTo(30);
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenCandidateMissing")
        void shouldThrowNotFound_WhenCandidateMissing() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.updateProfile(CANDIDATE_ID,
                    new UpdateCandidateRequest("X", null, null), ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(candidateRepository, never()).save(any());
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("skills")
    class Skills {

        @Test
        @DisplayName("shouldReturnSkillNames_WhenLinksExist")
        void shouldReturnSkillNames_WhenLinksExist() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateSkillRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID))
                    .thenReturn(List.of(candidateSkillLink()));
            when(skillRepository.findAllById(List.of(SKILL_ID))).thenReturn(List.of(skill("Java")));

            // Act
            SkillsResponse response = candidateService.getSkills(CANDIDATE_ID);

            // Assert
            assertThat(response.candidateId()).isEqualTo(CANDIDATE_ID);
            assertThat(response.skills()).containsExactly("Java");
        }

        @Test
        @DisplayName("shouldReturnEmptySkills_WhenNoLinks")
        void shouldReturnEmptySkills_WhenNoLinks() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateSkillRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());

            // Act
            SkillsResponse response = candidateService.getSkills(CANDIDATE_ID);

            // Assert
            assertThat(response.skills()).isEmpty();
            verify(skillRepository, never()).findAllById(any());
        }

        @Test
        @DisplayName("shouldReplaceSkills_WhenUpdateSkillsCalled")
        void shouldReplaceSkills_WhenUpdateSkillsCalled() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(skillService.resolveOrCreate(eq("Java"), eq(ACTOR_ID))).thenReturn(skill("Java"));
            when(candidateSkillRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID))
                    .thenReturn(List.of(candidateSkillLink()));
            when(skillRepository.findAllById(any())).thenReturn(List.of(skill("Java")));

            // Act
            SkillsResponse response = candidateService.updateSkills(CANDIDATE_ID, List.of("Java", "  "), ACTOR_ID);

            // Assert — old links cleared, blank skill skipped, one link saved
            verify(candidateSkillRepository).deleteByCandidateId(CANDIDATE_ID);
            verify(skillService, times(1)).resolveOrCreate(any(), any());
            ArgumentCaptor<CandidateSkill> captor = ArgumentCaptor.forClass(CandidateSkill.class);
            verify(candidateSkillRepository).save(captor.capture());
            assertThat(captor.getValue().getSkillId()).isEqualTo(SKILL_ID);
            assertThat(response.skills()).containsExactly("Java");
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenUpdatingSkillsForUnknownCandidate")
        void shouldThrowNotFound_WhenUpdatingSkillsForUnknownCandidate() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.updateSkills(CANDIDATE_ID, List.of("Java"), ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(candidateSkillRepository, never()).deleteByCandidateId(any());
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("education")
    class EducationTests {

        @Test
        @DisplayName("shouldAddEducation_MappingEndYearToGraduationYear")
        void shouldAddEducation_MappingEndYearToGraduationYear() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(educationRepository.save(any(Education.class))).thenAnswer(inv -> {
                Education e = inv.getArgument(0);
                e.setEducationId(500L);
                return e;
            });
            EducationRequest req = new EducationRequest("B.Tech", "IIT", "CS", 2016, 2020);

            // Act
            EducationResponse response = candidateService.addEducation(CANDIDATE_ID, req, ACTOR_ID);

            // Assert — endYear -> graduationYear; startYear and fieldOfStudy now persist (V29)
            assertThat(response.educationId()).isEqualTo(500L);
            assertThat(response.degree()).isEqualTo("B.Tech");
            assertThat(response.endYear()).isEqualTo(2020);
            assertThat(response.startYear()).isEqualTo(2016);
            assertThat(response.fieldOfStudy()).isEqualTo("CS");
            ArgumentCaptor<Education> captor = ArgumentCaptor.forClass(Education.class);
            verify(educationRepository).save(captor.capture());
            assertThat(captor.getValue().getGraduationYear()).isEqualTo((short) 2020);
        }

        @Test
        @DisplayName("shouldStoreStartYearSeparately_WhenEndYearNull")
        void shouldStoreStartYearSeparately_WhenEndYearNull() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(educationRepository.save(any(Education.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act — endYear null: startYear persists in its own column (V29), not graduation_year
            candidateService.addEducation(CANDIDATE_ID, new EducationRequest("MBA", "IIM", null, 2018, null), ACTOR_ID);

            // Assert
            ArgumentCaptor<Education> captor = ArgumentCaptor.forClass(Education.class);
            verify(educationRepository).save(captor.capture());
            assertThat(captor.getValue().getStartYear()).isEqualTo((short) 2018);
            assertThat(captor.getValue().getGraduationYear()).isNull();
        }

        @Test
        @DisplayName("shouldUpdateEducation_WhenExists")
        void shouldUpdateEducation_WhenExists() {
            // Arrange
            Education existing = Education.builder().educationId(500L).candidateId(CANDIDATE_ID)
                    .degree("Old").institution("Old Inst").graduationYear((short) 2015).isActive(true).build();
            when(educationRepository.findById(500L)).thenReturn(Optional.of(existing));
            when(educationRepository.save(any(Education.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            EducationResponse response = candidateService.updateEducation(CANDIDATE_ID, 500L,
                    new EducationRequest("M.Tech", "NIT", null, null, 2022), ACTOR_ID);

            // Assert
            assertThat(response.degree()).isEqualTo("M.Tech");
            assertThat(response.endYear()).isEqualTo(2022);
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenUpdatingUnknownEducation")
        void shouldThrowNotFound_WhenUpdatingUnknownEducation() {
            // Arrange
            when(educationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.updateEducation(CANDIDATE_ID, 999L,
                    new EducationRequest("X", null, null, null, null), ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("shouldDeleteEducation_WhenBelongsToCandidate")
        void shouldDeleteEducation_WhenBelongsToCandidate() {
            // Arrange
            Education e = Education.builder().educationId(500L).candidateId(CANDIDATE_ID).isActive(true).build();
            when(educationRepository.findById(500L)).thenReturn(Optional.of(e));

            // Act
            candidateService.deleteEducation(CANDIDATE_ID, 500L);

            // Assert
            verify(educationRepository).delete(e);
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenDeletingEducationOfAnotherCandidate")
        void shouldThrowNotFound_WhenDeletingEducationOfAnotherCandidate() {
            // Arrange — the row belongs to a different candidate
            Education e = Education.builder().educationId(500L).candidateId(CANDIDATE_ID + 1).isActive(true).build();
            when(educationRepository.findById(500L)).thenReturn(Optional.of(e));

            // Act & Assert
            assertThatThrownBy(() -> candidateService.deleteEducation(CANDIDATE_ID, 500L))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(educationRepository, never()).delete(any());
        }

        @Test
        @DisplayName("shouldReturnEducationList")
        void shouldReturnEducationList() {
            // Arrange
            Education e = Education.builder().educationId(500L).candidateId(CANDIDATE_ID)
                    .degree("B.Tech").institution("IIT").graduationYear((short) 2020).isActive(true).build();
            when(educationRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of(e));

            // Act
            List<EducationResponse> list = candidateService.getEducation(CANDIDATE_ID);

            // Assert
            assertThat(list).hasSize(1);
            assertThat(list.get(0).degree()).isEqualTo("B.Tech");
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("workExperience")
    class WorkExperienceTests {

        @Test
        @DisplayName("shouldAddWorkExperience_WithEndDate")
        void shouldAddWorkExperience_WithEndDate() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(workExperienceRepository.save(any(WorkExperience.class))).thenAnswer(inv -> {
                WorkExperience w = inv.getArgument(0);
                w.setExperienceId(700L);
                return w;
            });
            WorkExperienceRequest req = new WorkExperienceRequest("Infosys", "Engineer",
                    "2020-01-01", "2022-01-01", false, "Built things");

            // Act
            WorkExperienceResponse response = candidateService.addWorkExperience(CANDIDATE_ID, req, ACTOR_ID);

            // Assert
            assertThat(response.workExperienceId()).isEqualTo(700L);
            assertThat(response.companyName()).isEqualTo("Infosys");
            assertThat(response.jobTitle()).isEqualTo("Engineer");
            assertThat(response.isCurrent()).isFalse();
            assertThat(response.endDate()).isEqualTo("2022-01-01");
        }

        @Test
        @DisplayName("shouldNullifyEndDate_WhenIsCurrentTrue")
        void shouldNullifyEndDate_WhenIsCurrentTrue() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(workExperienceRepository.save(any(WorkExperience.class))).thenAnswer(inv -> inv.getArgument(0));
            WorkExperienceRequest req = new WorkExperienceRequest("TCS", "Lead",
                    "2022-02-01", "2023-01-01", true, null);

            // Act
            WorkExperienceResponse response = candidateService.addWorkExperience(CANDIDATE_ID, req, ACTOR_ID);

            // Assert — isCurrent overrides supplied endDate
            assertThat(response.isCurrent()).isTrue();
            assertThat(response.endDate()).isNull();
            ArgumentCaptor<WorkExperience> captor = ArgumentCaptor.forClass(WorkExperience.class);
            verify(workExperienceRepository).save(captor.capture());
            assertThat(captor.getValue().getEndDate()).isNull();
            assertThat(captor.getValue().getStartDate()).isEqualTo(LocalDate.of(2022, 2, 1));
        }

        @Test
        @DisplayName("shouldUpdateWorkExperience_WhenExists")
        void shouldUpdateWorkExperience_WhenExists() {
            // Arrange
            WorkExperience existing = WorkExperience.builder().experienceId(700L).candidateId(CANDIDATE_ID)
                    .companyName("Old").designation("Old").isActive(true).build();
            when(workExperienceRepository.findById(700L)).thenReturn(Optional.of(existing));
            when(workExperienceRepository.save(any(WorkExperience.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            WorkExperienceResponse response = candidateService.updateWorkExperience(CANDIDATE_ID, 700L,
                    new WorkExperienceRequest("Google", "SWE", "2021-01-01", null, true, "work"), ACTOR_ID);

            // Assert
            assertThat(response.companyName()).isEqualTo("Google");
            assertThat(response.jobTitle()).isEqualTo("SWE");
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenUpdatingUnknownWorkExperience")
        void shouldThrowNotFound_WhenUpdatingUnknownWorkExperience() {
            // Arrange
            when(workExperienceRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.updateWorkExperience(CANDIDATE_ID, 999L,
                    new WorkExperienceRequest("A", "B", null, null, false, null), ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("shouldDeleteWorkExperience_WhenBelongsToCandidate")
        void shouldDeleteWorkExperience_WhenBelongsToCandidate() {
            // Arrange
            WorkExperience w = WorkExperience.builder().experienceId(700L).candidateId(CANDIDATE_ID).isActive(true).build();
            when(workExperienceRepository.findById(700L)).thenReturn(Optional.of(w));

            // Act
            candidateService.deleteWorkExperience(CANDIDATE_ID, 700L);

            // Assert
            verify(workExperienceRepository).delete(w);
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("certifications")
    class Certifications {

        @Test
        @DisplayName("shouldAddCertification_WhenCandidateExists")
        void shouldAddCertification_WhenCandidateExists() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(certificationRepository.save(any(Certification.class))).thenAnswer(inv -> {
                Certification c = inv.getArgument(0);
                c.setCertificationId(900L);
                return c;
            });
            CertificationRequest req = new CertificationRequest("AWS Certified Developer", "AWS", "2024-03-15");

            // Act
            CertificationResponse response = candidateService.addCertification(CANDIDATE_ID, req, ACTOR_ID);

            // Assert
            assertThat(response.certificationId()).isEqualTo(900L);
            assertThat(response.name()).isEqualTo("AWS Certified Developer");
            assertThat(response.issuer()).isEqualTo("AWS");
            assertThat(response.issueDate()).isEqualTo("2024-03-15");
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenAddingCertificationForUnknownCandidate")
        void shouldThrowNotFound_WhenAddingCertificationForUnknownCandidate() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.addCertification(CANDIDATE_ID,
                    new CertificationRequest("X", "Y", null), ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(certificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("shouldDeleteCertification_WhenBelongsToCandidate")
        void shouldDeleteCertification_WhenBelongsToCandidate() {
            // Arrange
            Certification c = Certification.builder().certificationId(900L).candidateId(CANDIDATE_ID).isActive(true).build();
            when(certificationRepository.findById(900L)).thenReturn(Optional.of(c));

            // Act
            candidateService.deleteCertification(CANDIDATE_ID, 900L);

            // Assert
            verify(certificationRepository).delete(c);
        }

        @Test
        @DisplayName("shouldReturnCertificationList")
        void shouldReturnCertificationList() {
            // Arrange
            Certification c = Certification.builder().certificationId(900L).candidateId(CANDIDATE_ID)
                    .certificationName("AWS").issuedBy("Amazon").issueDate(LocalDate.of(2024, 3, 15)).isActive(true).build();
            when(certificationRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of(c));

            // Act
            List<CertificationResponse> list = candidateService.getCertifications(CANDIDATE_ID);

            // Assert
            assertThat(list).hasSize(1);
            assertThat(list.get(0).issuer()).isEqualTo("Amazon");
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("resume")
    class Resume {

        @Test
        @DisplayName("shouldUploadResume_WhenFileValid")
        void shouldUploadResume_WhenFileValid(@org.junit.jupiter.api.io.TempDir Path tempDir) {
            // Arrange
            ReflectionTestUtils.setField(candidateService, "uploadPath", tempDir.toString());
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateRepository.save(any(Candidate.class))).thenAnswer(inv -> inv.getArgument(0));
            MultipartFile file = new MockMultipartFile("resume", "john_doe.pdf", "application/pdf", "cv".getBytes());

            // Act
            ResumeUploadResponse response = candidateService.uploadResume(CANDIDATE_ID, file, ACTOR_ID);

            // Assert
            assertThat(response.fileName()).isEqualTo("john_doe.pdf");
            assertThat(response.status()).isEqualTo("Uploaded");
            ArgumentCaptor<Candidate> captor = ArgumentCaptor.forClass(Candidate.class);
            verify(candidateRepository).save(captor.capture());
            assertThat(captor.getValue().getResumeUrl()).contains("/files/resumes/" + CANDIDATE_ID);
        }

        @Test
        @DisplayName("shouldThrowBusinessException_WhenFileTransferFails")
        void shouldThrowBusinessException_WhenFileTransferFails(@org.junit.jupiter.api.io.TempDir Path tempDir) throws Exception {
            // Arrange
            ReflectionTestUtils.setField(candidateService, "uploadPath", tempDir.toString());
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn("bad.pdf");
            doThrow(new IOException("disk full")).when(file).transferTo(any(java.io.File.class));

            // Act & Assert
            assertThatThrownBy(() -> candidateService.uploadResume(CANDIDATE_ID, file, ACTOR_ID))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertThat(((BusinessException) ex).getErrorCode()).isEqualTo("RESUME_UPLOAD_FAILED"));
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenUploadingForUnknownCandidate")
        void shouldThrowNotFound_WhenUploadingForUnknownCandidate() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());
            MultipartFile file = new MockMultipartFile("resume", "x.pdf", "application/pdf", "x".getBytes());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.uploadResume(CANDIDATE_ID, file, ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("shouldReturnPendingReview_WhenParsingResume")
        void shouldReturnPendingReview_WhenParsingResume() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateSkillRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID))
                    .thenReturn(List.of(candidateSkillLink()));
            when(skillRepository.findAllById(any())).thenReturn(List.of(skill("Java")));
            when(certificationRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());
            when(workExperienceRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());
            when(educationRepository.findByCandidateIdAndIsActiveTrue(CANDIDATE_ID)).thenReturn(List.of());

            // Act
            ResumeParseResponse response = candidateService.parseResume(CANDIDATE_ID);

            // Assert
            assertThat(response.status()).isEqualTo("PendingReview");
            assertThat(response.candidateId()).isEqualTo(CANDIDATE_ID);
            assertThat(response.extracted().skills()).containsExactly("Java");
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenParsingForUnknownCandidate")
        void shouldThrowNotFound_WhenParsingForUnknownCandidate() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.parseResume(CANDIDATE_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("resolveCandidateId")
    class ResolveCandidateId {

        @Test
        @DisplayName("shouldReturnCandidateId_WhenProfileExists")
        void shouldReturnCandidateId_WhenProfileExists() {
            // Arrange
            when(candidateRepository.findByUserId(USER_ID)).thenReturn(Optional.of(candidate));

            // Act
            Long id = candidateService.resolveCandidateId(USER_ID);

            // Assert
            assertThat(id).isEqualTo(CANDIDATE_ID);
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenNoProfileForUser")
        void shouldThrowNotFound_WhenNoProfileForUser() {
            // Arrange
            when(candidateRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.resolveCandidateId(USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
            verifyNoInteractions(skillService);
        }
    }

    // =====================================================================
    @Nested
    @DisplayName("deleteCandidate")
    class DeleteCandidate {

        @Test
        @DisplayName("shouldSoftDeleteAndAudit_WhenCandidateExists")
        void shouldSoftDeleteAndAudit_WhenCandidateExists() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.of(candidate));
            when(candidateRepository.save(any(Candidate.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            candidateService.deleteCandidate(CANDIDATE_ID, ACTOR_ID);

            // Assert — soft delete (is_active=false), stamped, and audited (not a hard delete)
            ArgumentCaptor<Candidate> captor = ArgumentCaptor.forClass(Candidate.class);
            verify(candidateRepository).save(captor.capture());
            assertThat(captor.getValue().getIsActive()).isFalse();
            assertThat(captor.getValue().getModifiedBy()).isEqualTo(ACTOR_ID);
            verify(candidateRepository, never()).deleteById(anyLong());
            verify(auditService).log(eq(ACTOR_ID), eq("DELETE"), eq("Candidate"), eq(CANDIDATE_ID), any(), any());
        }

        @Test
        @DisplayName("shouldThrowNotFound_WhenCandidateMissing")
        void shouldThrowNotFound_WhenCandidateMissing() {
            // Arrange
            when(candidateRepository.findById(CANDIDATE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> candidateService.deleteCandidate(CANDIDATE_ID, ACTOR_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(candidateRepository, never()).save(any());
        }
    }
}
