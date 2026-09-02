package com.talentai.job.controller;

import com.talentai.common.response.ListResponse;
import com.talentai.job.dto.JobDtos.*;
import com.talentai.job.service.JobService;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<CreateJobResponse> create(@Valid @RequestBody CreateJobRequest req,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.create(req, principal.getUserId()));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobDetailResponse> get(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.getJob(jobId));
    }

    @PutMapping("/{jobId}")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<JobStatusResponse> update(@PathVariable Long jobId, @Valid @RequestBody CreateJobRequest req,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.update(jobId, req, principal.getUserId()));
    }

    @PatchMapping("/{jobId}/submit")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<JobStatusResponse> submit(@PathVariable Long jobId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.submit(jobId, principal.getUserId()));
    }

    @PatchMapping("/{jobId}/approve")
    @PreAuthorize("hasAnyRole('HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<JobStatusResponse> approve(@PathVariable Long jobId, @Valid @RequestBody ApproveJobRequest req,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.approve(jobId, req, principal.getUserId()));
    }

    @PatchMapping("/{jobId}/publish")
    @PreAuthorize("hasAnyRole('RECRUITER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<JobStatusResponse> publish(@PathVariable Long jobId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.publish(jobId, principal.getUserId()));
    }

    @PatchMapping("/{jobId}/close")
    @PreAuthorize("hasAnyRole('RECRUITER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<JobStatusResponse> close(@PathVariable Long jobId,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.close(jobId, principal.getUserId()));
    }

    @PatchMapping("/{jobId}/archive")
    @PreAuthorize("hasAnyRole('RECRUITER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<JobStatusResponse> archive(@PathVariable Long jobId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.archive(jobId, principal.getUserId()));
    }

    @GetMapping
    public ResponseEntity<ListResponse<JobDetailResponse>> search(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String skills,
            @RequestParam(required = false) BigDecimal experience,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.search(location, skills, experience, status, page, size));
    }
}
