package com.talentai.common.exception;

/** Mapped to HTTP 403 by GlobalExceptionHandler. */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
