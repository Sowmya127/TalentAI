package com.talentai.report.service;

import com.talentai.report.dto.HiringDecisionRow;
import com.talentai.report.dto.HiringReportDtos.HiringDecisionRowDto;
import com.talentai.report.dto.HiringReportDtos.HiringDecisionSummary;
import com.talentai.report.repository.HiringReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Builds the hiring-manager decision history (selected vs rejected) and its CSV export. */
@Service
@RequiredArgsConstructor
public class HiringReportService {

    private static final int MAX_DAYS = 365;

    private final HiringReportRepository hiringReportRepository;

    @Transactional(readOnly = true)
    public HiringDecisionSummary decisions(int days) {
        int window = Math.min(MAX_DAYS, Math.max(1, days));
        LocalDate today = LocalDate.now();
        LocalDateTime since = today.minusDays(window).atStartOfDay();

        List<HiringDecisionRow> rows = hiringReportRepository.findDecisionsSince(since);
        long selected = rows.stream().filter(r -> "Selected".equalsIgnoreCase(r.getDecision())).count();
        long rejected = rows.stream().filter(r -> "Rejected".equalsIgnoreCase(r.getDecision())).count();

        List<HiringDecisionRowDto> dtos = rows.stream()
                .map(r -> new HiringDecisionRowDto(
                        r.getApplicationId(),
                        r.getDecisionDate() == null ? null : r.getDecisionDate().toString(),
                        r.getCandidateName(),
                        r.getEmail(),
                        r.getJobTitle(),
                        r.getDecision()))
                .toList();

        return new HiringDecisionSummary(window, since.toLocalDate().toString(), today.toString(),
                selected, rejected, selected + rejected, dtos);
    }

    /** RFC-4180-ish CSV of the decision rows, with a header line. */
    public String toCsv(HiringDecisionSummary summary) {
        StringBuilder sb = new StringBuilder("Decision Date,Candidate,Email,Job Title,Decision\n");
        for (HiringDecisionRowDto r : summary.rows()) {
            sb.append(csv(r.decisionDate())).append(',')
              .append(csv(r.candidateName())).append(',')
              .append(csv(r.email())).append(',')
              .append(csv(r.jobTitle())).append(',')
              .append(csv(r.decision())).append('\n');
        }
        return sb.toString();
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) ? "\"" + escaped + "\"" : escaped;
    }
}
