package com.talentai.application.controller;

import com.talentai.application.dto.ApplicationDtos.*;
import com.talentai.application.service.ApplicationService;
import com.talentai.common.response.ListResponse;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/jobs/{jobId}/apply")
    public ResponseEntity<ApplyJobResponse> apply(@PathVariable Long jobId, @Valid @RequestBody ApplyJobRequest req,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.apply(jobId, req.candidateId(), principal.getUserId()));
    }

    @PatchMapping("/applications/{applicationId}/withdraw")
    public ResponseEntity<UpdateApplicationStatusResponse> withdraw(@PathVariable Long applicationId,
                                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.withdraw(applicationId, principal.getUserId()));
    }

    @PatchMapping("/applications/{applicationId}/status")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<UpdateApplicationStatusResponse> updateStatus(@PathVariable Long applicationId,
                                                                        @Valid @RequestBody UpdateApplicationStatusRequest req,
                                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.updateStatus(applicationId, req, principal.getUserId()));
    }

    @GetMapping("/candidates/{candidateId}/applications")
    public ResponseEntity<ListResponse<CandidateApplicationSummary>> candidateApplications(@PathVariable Long candidateId) {
        return ResponseEntity.ok(applicationService.getCandidateApplications(candidateId));
    }

    @GetMapping("/jobs/{jobId}/applications")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<ListResponse<ApplicantSummary>> applicants(@PathVariable Long jobId,
                                                                     @RequestParam(required = false) String status,
                                                                     @RequestParam(defaultValue = "1") int page,
                                                                     @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(applicationService.getApplicants(jobId, status, page, size));
    }
}
