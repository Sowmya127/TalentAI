package com.talentai.application.service;

import java.util.Map;

/**
 * Bridges the application_status DB vocabulary (V14 CHECK) and the API/UI
 * vocabulary. The DB has no 'OnHold' — 'Under Review' is the hold state.
 */
public final class ApplicationStatusMapper {

    private ApplicationStatusMapper() {
    }

    private static final Map<String, String> DB_TO_API = Map.of(
            "Under Review", "OnHold",
            "Interview Scheduled", "Scheduled",
            "Interview Completed", "Completed",
            "Offer Sent", "OfferSent");

    private static final Map<String, String> API_TO_DB = Map.of(
            "OnHold", "Under Review",
            "Scheduled", "Interview Scheduled",
            "Completed", "Interview Completed",
            "OfferSent", "Offer Sent");

    public static String toApi(String dbStatus) {
        return dbStatus == null ? null : DB_TO_API.getOrDefault(dbStatus, dbStatus);
    }

    public static String toDb(String apiStatus) {
        return apiStatus == null ? null : API_TO_DB.getOrDefault(apiStatus, apiStatus);
    }
}
