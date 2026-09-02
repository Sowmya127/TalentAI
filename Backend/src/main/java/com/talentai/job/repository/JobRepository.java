package com.talentai.job.repository;

import com.talentai.job.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT j FROM Job j WHERE j.isActive = true "
            + "AND (:status IS NULL OR j.jobStatus = :status) "
            + "AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) "
            + "AND (:minExp IS NULL OR j.experienceRequiredMax IS NULL OR j.experienceRequiredMax >= :minExp) "
            + "AND (:skill IS NULL OR EXISTS (SELECT 1 FROM JobSkill js, com.talentai.skill.entity.Skill s "
            + "     WHERE js.jobId = j.jobId AND s.skillId = js.skillId "
            + "     AND LOWER(s.skillName) LIKE LOWER(CONCAT('%', :skill, '%')))) "
            + "ORDER BY j.jobId DESC")
    Page<Job> search(@Param("status") String status,
                     @Param("location") String location,
                     @Param("minExp") java.math.BigDecimal minExp,
                     @Param("skill") String skill,
                     Pageable pageable);

    long countByJobStatus(String jobStatus);
}
