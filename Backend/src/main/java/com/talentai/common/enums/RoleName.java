package com.talentai.common.enums;

/** Mirrors the six roles seeded in V25__seed_reference_data.sql.
 *  Role itself stays a database table (configurable), not a fixed
 *  enum column -- this exists only for type-safe references to the
 *  seeded values in application code. */
public enum RoleName {

    CANDIDATE("Candidate"),
    RECRUITER("Recruiter"),
    HIRING_MANAGER("Hiring Manager"),
    INTERVIEWER("Interviewer"),
    HR_ADMIN("HR Admin"),
    SYSTEM_ADMIN("System Admin");

    private final String dbValue;

    RoleName(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }
}
