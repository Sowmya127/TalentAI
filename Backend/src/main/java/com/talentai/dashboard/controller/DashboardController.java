package com.talentai.dashboard.controller;

import com.talentai.application.repository.ApplicationRepository;
import com.talentai.config.CacheConfig;
import com.talentai.dashboard.dto.DashboardDtos.*;
import com.talentai.interview.repository.InterviewRepository;
import com.talentai.job.repository.JobRepository;
import com.talentai.offer.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only recruitment aggregations. Metrics are computed from live data
 * where the schema supports it; time-to-fill is approximated from
 * time-to-hire (no dedicated requisition-open-to-fill timestamp is tracked).
 */
@RestController
@RequestMapping("/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final OfferRepository offerRepository;

    @GetMapping
    @Cacheable(cacheNames = CacheConfig.DASHBOARD, key = "'summary'")
    public ResponseEntity<DashboardSummary> summary() {
        long open = jobRepository.countByJobStatus("Open");
        long applications = applicationRepository.count();
        long shortlisted = applicationRepository.countByApplicationStatus("Shortlisted");
        long interviews = interviewRepository.count();
        long offers = offerRepository.count();
        long hires = applicationRepository.countByApplicationStatus("Hired");
        return ResponseEntity.ok(new DashboardSummary(open, applications, shortlisted, interviews, offers, hires));
    }

    @GetMapping("/metrics")
    @Cacheable(cacheNames = CacheConfig.DASHBOARD, key = "'metrics'")
    public ResponseEntity<HiringMetrics> metrics() {
        Double avg = applicationRepository.avgDaysToHire();
        long timeToHire = avg == null ? 0 : Math.round(avg);
        long accepted = offerRepository.countByOfferStatus("Accepted");
        long declined = offerRepository.countByOfferStatus("Declined");
        double acceptanceRate = (accepted + declined) == 0 ? 0.0
                : Math.round((accepted * 100.0 / (accepted + declined))) / 100.0;
        return ResponseEntity.ok(new HiringMetrics(timeToHire, timeToHire, acceptanceRate));
    }

    @GetMapping("/funnel")
    @Cacheable(cacheNames = CacheConfig.DASHBOARD, key = "'funnel:' + (#jobId == null ? 'all' : #jobId)")
    public ResponseEntity<RecruitmentFunnel> funnel(@RequestParam(required = false) Long jobId) {
        long applied;
        long shortlisted;
        long hired;
        long interviewed;
        long offered;
        if (jobId != null) {
            applied = applicationRepository.countByJobId(jobId);
            shortlisted = applicationRepository.countByJobIdAndApplicationStatus(jobId, "Shortlisted");
            interviewed = applicationRepository.countByJobIdAndApplicationStatus(jobId, "Interview Completed");
            offered = applicationRepository.countByJobIdAndApplicationStatus(jobId, "Offer Sent");
            hired = applicationRepository.countByJobIdAndApplicationStatus(jobId, "Hired");
        } else {
            applied = applicationRepository.count();
            shortlisted = applicationRepository.countByApplicationStatus("Shortlisted");
            interviewed = applicationRepository.countByApplicationStatus("Interview Completed");
            offered = applicationRepository.countByApplicationStatus("Offer Sent");
            hired = applicationRepository.countByApplicationStatus("Hired");
        }
        long screened = Math.max(shortlisted, interviewed);
        return ResponseEntity.ok(new RecruitmentFunnel(applied, screened, shortlisted, interviewed, offered, hired));
    }

    @GetMapping("/time-to-hire")
    @Cacheable(cacheNames = CacheConfig.DASHBOARD,
            key = "'tth:' + (#department == null ? 'all' : #department) + ':' + (#period == null ? 'all' : #period)")
    public ResponseEntity<TimeToHire> timeToHire(@RequestParam(required = false) String department,
                                                 @RequestParam(required = false) String period) {
        Double avg = applicationRepository.avgDaysToHire();
        return ResponseEntity.ok(new TimeToHire(department == null ? "All" : department, avg == null ? 0 : Math.round(avg)));
    }
}
