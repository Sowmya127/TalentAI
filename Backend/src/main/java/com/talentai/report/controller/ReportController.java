package com.talentai.report.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Report generation returns a descriptor with a downloadUrl per the API
 * spec (FR-RPT-06). Actual file generation/storage is not wired up here,
 * so the downloadUrl is a placeholder path — the endpoint exists so the
 * reporting UI has a stable contract to call.
 */
@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
public class ReportController {

    @GetMapping("/candidates")
    public ResponseEntity<Map<String, String>> candidates(@RequestParam(defaultValue = "csv") String format) {
        return report("RPT-CAND-001", format);
    }

    @GetMapping("/jobs")
    public ResponseEntity<Map<String, String>> jobs(@RequestParam(defaultValue = "csv") String format) {
        return report("RPT-JOBS-001", format);
    }

    private ResponseEntity<Map<String, String>> report(String reportId, String format) {
        return ResponseEntity.ok(Map.of(
                "reportId", reportId,
                "downloadUrl", "/files/reports/" + reportId + "." + format));
    }
}
