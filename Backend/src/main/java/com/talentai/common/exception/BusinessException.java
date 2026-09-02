package com.talentai.common.exception;

import lombok.Getter;

/** Generic business-rule violation, mapped to HTTP 400 by GlobalExceptionHandler. */
@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
