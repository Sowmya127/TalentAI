package com.talentai.registration.repository;

import com.talentai.registration.entity.UserRegistrationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRegistrationRequestRepository extends JpaRepository<UserRegistrationRequest, Long> {

    Optional<UserRegistrationRequest> findByUserId(Long userId);

    /**
     * Admin review queue: optional status filter + optional free-text search over the
     * applicant's name/email and the claimed company. Native so it can join app_user +
     * company; {@code Pageable}'s sort must use native column names (see the service).
     */
    @Query(value = "SELECT r.* FROM user_registration_request r "
            + "JOIN app_user u ON u.user_id = r.user_id "
            + "LEFT JOIN company c ON c.company_id = r.company_id "
            + "WHERE (:status IS NULL OR r.status = :status) "
            + "AND (:q IS NULL "
            + "     OR LOWER(u.first_name) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.last_name)  LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.email)      LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(c.company_name) LIKE CONCAT('%', :q, '%'))",
            countQuery = "SELECT COUNT(*) FROM user_registration_request r "
            + "JOIN app_user u ON u.user_id = r.user_id "
            + "LEFT JOIN company c ON c.company_id = r.company_id "
            + "WHERE (:status IS NULL OR r.status = :status) "
            + "AND (:q IS NULL "
            + "     OR LOWER(u.first_name) LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.last_name)  LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(u.email)      LIKE CONCAT('%', :q, '%') "
            + "     OR LOWER(c.company_name) LIKE CONCAT('%', :q, '%'))",
            nativeQuery = true)
    Page<UserRegistrationRequest> search(@Param("status") String status, @Param("q") String q, Pageable pageable);
}
