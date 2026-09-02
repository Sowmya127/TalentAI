package com.talentai.offer.service;

import java.util.Map;

/**
 * Maps offer_status between DB (V19 CHECK: Draft, Pending Approval, Sent,
 * Accepted, Declined, Expired, Rescinded) and API/UI (Draft, Approved,
 * Sent, Accepted, Declined, Expired, Rejected). The DB uses
 * 'Pending Approval' as the post-approval / ready-to-send state and has
 * no 'Approved'/'Rejected' value.
 */
public final class OfferStatusMapper {

    private OfferStatusMapper() {
    }

    private static final Map<String, String> DB_TO_API = Map.of(
            "Pending Approval", "Approved",
            "Rescinded", "Rejected");

    private static final Map<String, String> API_TO_DB = Map.of(
            "Approved", "Pending Approval",
            "Rejected", "Rescinded");

    public static String toApi(String dbStatus) {
        return dbStatus == null ? null : DB_TO_API.getOrDefault(dbStatus, dbStatus);
    }

    public static String toDb(String apiStatus) {
        return apiStatus == null ? null : API_TO_DB.getOrDefault(apiStatus, apiStatus);
    }
}
