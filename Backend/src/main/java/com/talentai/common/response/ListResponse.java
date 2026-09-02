package com.talentai.common.response;

import java.util.List;

/** The custom pagination envelope used across collection endpoints
 *  ({totalRecords, page, size, data}), with 1-indexed page numbers —
 *  distinct from Spring Data's own Page shape used by /users. */
public record ListResponse<T>(long totalRecords, int page, int size, List<T> data) {

    public static <T> ListResponse<T> of(List<T> data, long totalRecords, int page, int size) {
        return new ListResponse<>(totalRecords, page, size, data);
    }

    public static <T> ListResponse<T> of(List<T> data) {
        return new ListResponse<>(data.size(), 1, data.size(), data);
    }
}
