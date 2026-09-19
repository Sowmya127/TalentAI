package com.talentai.common.exception;

/** Thrown on login when the account is awaiting administrator approval. Maps to 403. */
public class PendingApprovalException extends RuntimeException {

    public PendingApprovalException(String message) {
        super(message);
    }
}
