package com.talentai.job.service;

import java.util.Map;

/**
 * Translates between the DB's job_status vocabulary (constrained by the
 * V7 CHECK: Draft, Pending Approval, Approved, Open, On Hold, Closed,
 * Cancelled) and the API/UI vocabulary (Draft, PendingApproval,
 * Approved, Published, OnHold, Closed, Archived). The DB has no
 * 'Published'/'Archived' — 'Open' is the published state and
 * 'Cancelled' is used for archive.
 */
public final class JobStatusMapper {

    private JobStatusMapper() {
    }

    private static final Map<String, String> DB_TO_API = Map.of(
            "Pending Approval", "PendingApproval",
            "Open", "Published",
            "On Hold", "OnHold",
            "Cancelled", "Archived");

    private static final Map<String, String> API_TO_DB = Map.of(
            "PendingApproval", "Pending Approval",
            "Published", "Open",
            "OnHold", "On Hold",
            "Archived", "Cancelled");

    public static String toApi(String dbStatus) {
        return dbStatus == null ? null : DB_TO_API.getOrDefault(dbStatus, dbStatus);
    }

    public static String toDb(String apiStatus) {
        return apiStatus == null ? null : API_TO_DB.getOrDefault(apiStatus, apiStatus);
    }
}
