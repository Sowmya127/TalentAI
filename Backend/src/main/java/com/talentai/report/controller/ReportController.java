package com.talentai.report.controller;

import com.talentai.report.dto.HiringReportDtos.HiringDecisionSummary;
import com.talentai.report.service.HiringReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Map;

/**
 * Reporting endpoints. The candidate/job descriptors return a downloadUrl per the
 * API spec (file generation not wired). The hiring-decision report is fully
 * implemented: it computes real selected/rejected counts and streams a CSV.
 */
@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
public class ReportController {

    private final HiringReportService hiringReportService;

    @GetMapping("/candidates")
    public ResponseEntity<Map<String, String>> candidates(@RequestParam(defaultValue = "csv") String format) {
        return report("RPT-CAND-001", format);
    }

    @GetMapping("/jobs")
    public ResponseEntity<Map<String, String>> jobs(@RequestParam(defaultValue = "csv") String format) {
        return report("RPT-JOBS-001", format);
    }

    /**
     * Hiring-manager decision history — how many candidates were Selected vs Rejected
     * in the last {@code days} days, with the detail rows. Restricted to the roles
     * that own that decision (Hiring Manager) plus administrators.
     */
    @GetMapping("/hiring-decisions")
    @PreAuthorize("hasAnyRole('HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<HiringDecisionSummary> hiringDecisions(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(hiringReportService.decisions(days));
    }

    /** The same report as a downloadable CSV file. */
    @GetMapping("/hiring-decisions/download")
    @PreAuthorize("hasAnyRole('HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<byte[]> hiringDecisionsCsv(@RequestParam(defaultValue = "7") int days) {
        HiringDecisionSummary summary = hiringReportService.decisions(days);
        byte[] body = hiringReportService.toCsv(summary).getBytes(StandardCharsets.UTF_8);
        String filename = "hiring-decisions-" + LocalDate.now() + "-last-" + summary.days() + "-days.csv";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }

    private ResponseEntity<Map<String, String>> report(String reportId, String format) {
        return ResponseEntity.ok(Map.of(
                "reportId", reportId,
                "downloadUrl", "/files/reports/" + reportId + "." + format));
    }
}
