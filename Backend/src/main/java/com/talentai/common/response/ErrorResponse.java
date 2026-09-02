package com.talentai.common.response;

import java.time.Instant;

/** Standard error body for every failure response, matching the shape
 *  already defined in the TalentAI API Specification (errorCode + message). */
public record ErrorResponse(String errorCode, String message, Instant timestamp) {

    public static ErrorResponse of(String errorCode, String message) {
        return new ErrorResponse(errorCode, message, Instant.now());
    }
}
