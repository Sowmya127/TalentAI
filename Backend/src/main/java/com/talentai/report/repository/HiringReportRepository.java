package com.talentai.report.repository;

import com.talentai.application.entity.Application;
import com.talentai.report.dto.HiringDecisionRow;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Read-only reporting query for the hiring-manager decision history. Bound to the
 * {@link Application} entity but exposes only the reporting projection — it does
 * not extend a full CRUD repository.
 */
public interface HiringReportRepository extends Repository<Application, Long> {

    /**
     * Every final hiring decision (application marked Selected or Rejected) whose
     * decision was recorded on/after {@code since}, newest first. The decision
     * timestamp is {@code modified_date} (when the status was last changed),
     * falling back to {@code created_date} when the row was never updated.
     */
    @Query(value = "SELECT a.application_id AS applicationId, a.application_status AS decision, "
            + "COALESCE(a.modified_date, a.created_date) AS decisionDate, "
            + "CONCAT(u.first_name, ' ', u.last_name) AS candidateName, u.email AS email, j.title AS jobTitle "
            + "FROM application a "
            + "JOIN candidate c ON c.candidate_id = a.candidate_id "
            + "JOIN app_user u ON u.user_id = c.user_id "
            + "JOIN job j ON j.job_id = a.job_id "
            + "WHERE a.application_status IN ('Selected', 'Rejected') "
            + "AND a.is_active = 1 AND COALESCE(a.modified_date, a.created_date) >= :since "
            + "ORDER BY COALESCE(a.modified_date, a.created_date) DESC",
            nativeQuery = true)
    List<HiringDecisionRow> findDecisionsSince(@Param("since") LocalDateTime since);
}
