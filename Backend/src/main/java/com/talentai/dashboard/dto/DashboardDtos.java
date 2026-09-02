package com.talentai.dashboard.dto;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record DashboardSummary(long openPositions, long applications, long shortlisted,
                                   long interviews, long offers, long hires) {
    }

    public record HiringMetrics(long timeToHire, long timeToFill, double offerAcceptanceRate) {
    }

    public record RecruitmentFunnel(long applied, long screened, long shortlisted,
                                    long interviewed, long offered, long hired) {
    }

    public record TimeToHire(String department, long avgTimeToHireDays) {
    }
}
