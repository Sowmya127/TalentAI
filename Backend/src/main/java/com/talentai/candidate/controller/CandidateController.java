package com.talentai.candidate.controller;

import com.talentai.candidate.dto.CandidateDtos.*;
import com.talentai.candidate.service.CandidateService;
import com.talentai.common.response.ListResponse;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Object-level authorization is enforced per method via {@code @PreAuthorize}
 * and {@link com.talentai.candidate.security.CandidateAccessGuard} (bean
 * {@code candidateAccessGuard}): recruitment staff may view any candidate,
 * admins may manage any candidate, and a Candidate may act only on their own
 * profile. Ownership is derived from the authenticated user, never the request.
 */
@RestController
@RequestMapping("/v1/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN','SYSTEM_ADMIN') or #req.userId() == authentication.principal.userId")
    public ResponseEntity<CandidateMessageResponse> create(@Valid @RequestBody CreateCandidateRequest req,
                                                            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.createProfile(req, principal.getUserId()));
    }

    @GetMapping("/me")
    public ResponseEntity<CandidateProfileResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.getMyProfile(principal.getUserId()));
    }

    /** Recruiter candidate search. A literal /search wins over /{candidateId}. */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('RECRUITER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<ListResponse<CandidateSearchResult>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) BigDecimal minExperience,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "experience") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(
                candidateService.searchCandidates(q, location, minExperience, page, size, sortBy, direction));
    }

    @GetMapping("/{candidateId}")
    @PreAuthorize("@candidateAccessGuard.canView(#candidateId, authentication)")
    public ResponseEntity<CandidateProfileResponse> get(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getProfile(candidateId));
    }

    /** Recruiter/admin soft-delete of a candidate profile. */
    @DeleteMapping("/{candidateId}")
    @PreAuthorize("hasAnyRole('RECRUITER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long candidateId,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        candidateService.deleteCandidate(candidateId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{candidateId}")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<CandidateMessageResponse> update(@PathVariable Long candidateId,
                                                           @Valid @RequestBody UpdateCandidateRequest req,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateProfile(candidateId, req, principal.getUserId()));
    }

    // --- Skills ---
    @GetMapping("/{candidateId}/skills")
    @PreAuthorize("@candidateAccessGuard.canView(#candidateId, authentication)")
    public ResponseEntity<SkillsResponse> getSkills(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getSkills(candidateId));
    }

    @PutMapping("/{candidateId}/skills")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<SkillsResponse> updateSkills(@PathVariable Long candidateId,
                                                       @Valid @RequestBody UpdateSkillsRequest req,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateSkills(candidateId, req.skills(), principal.getUserId()));
    }

    // --- Education ---
    @GetMapping("/{candidateId}/education")
    @PreAuthorize("@candidateAccessGuard.canView(#candidateId, authentication)")
    public ResponseEntity<List<EducationResponse>> getEducation(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getEducation(candidateId));
    }

    @PostMapping("/{candidateId}/education")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<EducationResponse> addEducation(@PathVariable Long candidateId,
                                                          @Valid @RequestBody EducationRequest req,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addEducation(candidateId, req, principal.getUserId()));
    }

    @PutMapping("/{candidateId}/education/{educationId}")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<EducationResponse> updateEducation(@PathVariable Long candidateId, @PathVariable Long educationId,
                                                             @Valid @RequestBody EducationRequest req,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateEducation(candidateId, educationId, req, principal.getUserId()));
    }

    @DeleteMapping("/{candidateId}/education/{educationId}")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long candidateId, @PathVariable Long educationId) {
        candidateService.deleteEducation(candidateId, educationId);
        return ResponseEntity.noContent().build();
    }

    // --- Work experience ---
    @GetMapping("/{candidateId}/work-experience")
    @PreAuthorize("@candidateAccessGuard.canView(#candidateId, authentication)")
    public ResponseEntity<List<WorkExperienceResponse>> getWork(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getWorkExperience(candidateId));
    }

    @PostMapping("/{candidateId}/work-experience")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<WorkExperienceResponse> addWork(@PathVariable Long candidateId,
                                                          @Valid @RequestBody WorkExperienceRequest req,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addWorkExperience(candidateId, req, principal.getUserId()));
    }

    @PutMapping("/{candidateId}/work-experience/{id}")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<WorkExperienceResponse> updateWork(@PathVariable Long candidateId, @PathVariable Long id,
                                                             @Valid @RequestBody WorkExperienceRequest req,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateWorkExperience(candidateId, id, req, principal.getUserId()));
    }

    @DeleteMapping("/{candidateId}/work-experience/{id}")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<Void> deleteWork(@PathVariable Long candidateId, @PathVariable Long id) {
        candidateService.deleteWorkExperience(candidateId, id);
        return ResponseEntity.noContent().build();
    }

    // --- Certifications ---
    @GetMapping("/{candidateId}/certifications")
    @PreAuthorize("@candidateAccessGuard.canView(#candidateId, authentication)")
    public ResponseEntity<List<CertificationResponse>> getCerts(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getCertifications(candidateId));
    }

    @PostMapping("/{candidateId}/certifications")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<CertificationResponse> addCert(@PathVariable Long candidateId,
                                                         @Valid @RequestBody CertificationRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addCertification(candidateId, req, principal.getUserId()));
    }

    @DeleteMapping("/{candidateId}/certifications/{certificationId}")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<Void> deleteCert(@PathVariable Long candidateId, @PathVariable Long certificationId) {
        candidateService.deleteCertification(candidateId, certificationId);
        return ResponseEntity.noContent().build();
    }

    // --- Resume ---
    @PostMapping("/{candidateId}/resume")
    @PreAuthorize("@candidateAccessGuard.canModify(#candidateId, authentication)")
    public ResponseEntity<ResumeUploadResponse> uploadResume(@PathVariable Long candidateId,
                                                             @RequestParam("resume") MultipartFile resume,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.uploadResume(candidateId, resume, principal.getUserId()));
    }

    @PostMapping("/{candidateId}/resume/parse")
    @PreAuthorize("@candidateAccessGuard.canView(#candidateId, authentication)")
    public ResponseEntity<ResumeParseResponse> parseResume(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.parseResume(candidateId));
    }
}
