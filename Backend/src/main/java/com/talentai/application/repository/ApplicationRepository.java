package com.talentai.application.repository;

import com.talentai.application.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

    List<Application> findByCandidateIdAndIsActiveTrueOrderByApplicationIdDesc(Long candidateId);

    @Query("SELECT a FROM Application a WHERE a.jobId = :jobId AND a.isActive = true "
            + "AND (:status IS NULL OR a.applicationStatus = :status) ORDER BY a.matchScore DESC, a.applicationId DESC")
    Page<Application> findByJob(@Param("jobId") Long jobId, @Param("status") String status, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.jobId = :jobId AND a.applicationStatus = :status AND a.isActive = true")
    List<Application> findByJobIdAndStatus(@Param("jobId") Long jobId, @Param("status") String status);

    long countByJobIdAndApplicationStatus(Long jobId, String status);

    long countByApplicationStatus(String status);

    long countByJobId(Long jobId);

    @Query(value = "SELECT AVG(DATEDIFF(modified_date, applied_date)) FROM application "
            + "WHERE application_status = 'Hired' AND modified_date IS NOT NULL", nativeQuery = true)
    Double avgDaysToHire();

    Optional<Application> findByApplicationIdAndIsActiveTrue(Long applicationId);
}
