package com.talentai.candidate.controller;

import com.talentai.candidate.dto.CandidateDtos.*;
import com.talentai.candidate.service.CandidateService;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    public ResponseEntity<CandidateMessageResponse> create(@Valid @RequestBody CreateCandidateRequest req,
                                                            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.createProfile(req, principal.getUserId()));
    }

    @GetMapping("/me")
    public ResponseEntity<CandidateProfileResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.getMyProfile(principal.getUserId()));
    }

    @GetMapping("/{candidateId}")
    public ResponseEntity<CandidateProfileResponse> get(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getProfile(candidateId));
    }

    @PutMapping("/{candidateId}")
    public ResponseEntity<CandidateMessageResponse> update(@PathVariable Long candidateId,
                                                           @Valid @RequestBody UpdateCandidateRequest req,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateProfile(candidateId, req, principal.getUserId()));
    }

    // --- Skills ---
    @GetMapping("/{candidateId}/skills")
    public ResponseEntity<SkillsResponse> getSkills(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getSkills(candidateId));
    }

    @PutMapping("/{candidateId}/skills")
    public ResponseEntity<SkillsResponse> updateSkills(@PathVariable Long candidateId,
                                                       @Valid @RequestBody UpdateSkillsRequest req,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateSkills(candidateId, req.skills(), principal.getUserId()));
    }

    // --- Education ---
    @GetMapping("/{candidateId}/education")
    public ResponseEntity<List<EducationResponse>> getEducation(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getEducation(candidateId));
    }

    @PostMapping("/{candidateId}/education")
    public ResponseEntity<EducationResponse> addEducation(@PathVariable Long candidateId,
                                                          @Valid @RequestBody EducationRequest req,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addEducation(candidateId, req, principal.getUserId()));
    }

    @PutMapping("/{candidateId}/education/{educationId}")
    public ResponseEntity<EducationResponse> updateEducation(@PathVariable Long candidateId, @PathVariable Long educationId,
                                                             @Valid @RequestBody EducationRequest req,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateEducation(candidateId, educationId, req, principal.getUserId()));
    }

    @DeleteMapping("/{candidateId}/education/{educationId}")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long candidateId, @PathVariable Long educationId) {
        candidateService.deleteEducation(educationId);
        return ResponseEntity.noContent().build();
    }

    // --- Work experience ---
    @GetMapping("/{candidateId}/work-experience")
    public ResponseEntity<List<WorkExperienceResponse>> getWork(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getWorkExperience(candidateId));
    }

    @PostMapping("/{candidateId}/work-experience")
    public ResponseEntity<WorkExperienceResponse> addWork(@PathVariable Long candidateId,
                                                          @Valid @RequestBody WorkExperienceRequest req,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addWorkExperience(candidateId, req, principal.getUserId()));
    }

    @PutMapping("/{candidateId}/work-experience/{id}")
    public ResponseEntity<WorkExperienceResponse> updateWork(@PathVariable Long candidateId, @PathVariable Long id,
                                                             @Valid @RequestBody WorkExperienceRequest req,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateService.updateWorkExperience(candidateId, id, req, principal.getUserId()));
    }

    @DeleteMapping("/{candidateId}/work-experience/{id}")
    public ResponseEntity<Void> deleteWork(@PathVariable Long candidateId, @PathVariable Long id) {
        candidateService.deleteWorkExperience(id);
        return ResponseEntity.noContent().build();
    }

    // --- Certifications ---
    @GetMapping("/{candidateId}/certifications")
    public ResponseEntity<List<CertificationResponse>> getCerts(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.getCertifications(candidateId));
    }

    @PostMapping("/{candidateId}/certifications")
    public ResponseEntity<CertificationResponse> addCert(@PathVariable Long candidateId,
                                                         @Valid @RequestBody CertificationRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.addCertification(candidateId, req, principal.getUserId()));
    }

    @DeleteMapping("/{candidateId}/certifications/{certificationId}")
    public ResponseEntity<Void> deleteCert(@PathVariable Long candidateId, @PathVariable Long certificationId) {
        candidateService.deleteCertification(certificationId);
        return ResponseEntity.noContent().build();
    }

    // --- Resume ---
    @PostMapping("/{candidateId}/resume")
    public ResponseEntity<ResumeUploadResponse> uploadResume(@PathVariable Long candidateId,
                                                             @RequestParam("resume") MultipartFile resume,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(candidateService.uploadResume(candidateId, resume, principal.getUserId()));
    }

    @PostMapping("/{candidateId}/resume/parse")
    public ResponseEntity<ResumeParseResponse> parseResume(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidateService.parseResume(candidateId));
    }
}
