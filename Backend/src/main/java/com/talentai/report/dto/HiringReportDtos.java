package com.talentai.report.dto;

import java.util.List;

/** Response shapes for the hiring-manager decision history report. */
public final class HiringReportDtos {

    private HiringReportDtos() {
    }

    /** Summary + detail rows for the "selected vs rejected in the last N days" report. */
    public record HiringDecisionSummary(
            int days,
            String from,
            String to,
            long selected,
            long rejected,
            long total,
            List<HiringDecisionRowDto> rows) {
    }

    /** A flattened, serialisable decision row (dates rendered as ISO strings). */
    public record HiringDecisionRowDto(
            Long applicationId,
            String decisionDate,
            String candidateName,
            String email,
            String jobTitle,
            String decision) {
    }
}
