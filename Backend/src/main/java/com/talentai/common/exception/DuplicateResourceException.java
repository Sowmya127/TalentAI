package com.talentai.common.exception;

/** Mapped to HTTP 409 by GlobalExceptionHandler. */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
