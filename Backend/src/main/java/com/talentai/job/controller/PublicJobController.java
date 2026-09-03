package com.talentai.job.controller;

import com.talentai.common.response.ListResponse;
import com.talentai.job.dto.JobDtos.JobDetailResponse;
import com.talentai.job.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unauthenticated, read-only view of currently published jobs, used by the
 * public landing page's "Live Now" card. Exposes only Published roles — no
 * drafts, pending, or internal statuses — and is whitelisted for GET in
 * {@code SecurityConfig} under {@code /v1/public/**}.
 */
@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicJobController {

    private final JobService jobService;

    @GetMapping("/jobs")
    public ResponseEntity<ListResponse<JobDetailResponse>> publishedJobs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.search(null, null, null, "Published", page, size));
    }
}
