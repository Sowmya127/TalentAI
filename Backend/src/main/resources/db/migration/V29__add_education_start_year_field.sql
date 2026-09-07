-- The candidate UI collects start year and field of study for each degree, but
-- V10 only stored graduation_year (= end year). Add the missing columns so both
-- persist and round-trip. Nullable + additive: safe for existing rows.
ALTER TABLE education ADD COLUMN field_of_study VARCHAR(150) NULL AFTER degree;
ALTER TABLE education ADD COLUMN start_year     SMALLINT     NULL AFTER institution;
ALTER TABLE education ADD CONSTRAINT ck_education_start_year
    CHECK (start_year IS NULL OR start_year BETWEEN 1950 AND 2100);
