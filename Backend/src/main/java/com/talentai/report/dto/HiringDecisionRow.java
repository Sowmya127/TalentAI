package com.talentai.report.dto;

import java.time.LocalDateTime;

/**
 * Spring Data projection for one hiring decision (a Selected/Rejected application),
 * populated from the native query in {@code HiringReportRepository}. The getter
 * names match the column aliases in that query.
 */
public interface HiringDecisionRow {
    Long getApplicationId();

    String getDecision();

    LocalDateTime getDecisionDate();

    String getCandidateName();

    String getEmail();

    String getJobTitle();
}
