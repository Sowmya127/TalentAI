package com.talentai.candidate.repository;

import com.talentai.candidate.entity.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    Optional<Candidate> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    /**
     * Recruiter candidate search: optional free-text over name/email/location,
     * optional location filter, and an optional minimum-experience floor. Native
     * so it can join app_user for the name/email; {@code Pageable}'s sort must use
     * native column names (whitelisted in the service). Only active candidates.
     * {@code :q} / {@code :location} are expected already lower-cased by the caller.
     */
    @Query(value = "SELECT c.* FROM candidate c JOIN app_user u ON u.user_id = c.user_id "
            + "WHERE c.is_active = 1 "
            + "AND (:q IS NULL OR LOWER(u.first_name) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.last_name) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.email) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(c.current_location) LIKE CONCAT('%', :q, '%')) "
            + "AND (:location IS NULL OR LOWER(c.current_location) LIKE CONCAT('%', :location, '%')) "
            + "AND (:minExp IS NULL OR c.total_experience >= :minExp)",
            countQuery = "SELECT COUNT(*) FROM candidate c JOIN app_user u ON u.user_id = c.user_id "
            + "WHERE c.is_active = 1 "
            + "AND (:q IS NULL OR LOWER(u.first_name) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.last_name) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.email) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(c.current_location) LIKE CONCAT('%', :q, '%')) "
            + "AND (:location IS NULL OR LOWER(c.current_location) LIKE CONCAT('%', :location, '%')) "
            + "AND (:minExp IS NULL OR c.total_experience >= :minExp)",
            nativeQuery = true)
    Page<Candidate> search(@Param("q") String q, @Param("location") String location,
                           @Param("minExp") BigDecimal minExp, Pageable pageable);
}
