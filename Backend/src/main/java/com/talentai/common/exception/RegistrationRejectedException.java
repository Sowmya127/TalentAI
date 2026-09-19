package com.talentai.common.exception;

/** Thrown on login when the account's registration was rejected. Maps to 403. */
public class RegistrationRejectedException extends RuntimeException {

    public RegistrationRejectedException(String message) {
        super(message);
    }
}
