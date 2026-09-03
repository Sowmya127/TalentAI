package com.talentai.job.repository;

import com.talentai.job.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {

    List<JobSkill> findByJobIdAndIsActiveTrue(Long jobId);

    /**
     * Bulk DELETE executed immediately so re-inserting the same (job_id, skill_id)
     * in the same transaction — the "replace all skills" flow on job edit —
     * cannot hit the unique constraint (Hibernate flushes inserts before deletes).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM JobSkill js WHERE js.jobId = :jobId")
    void deleteByJobId(@Param("jobId") Long jobId);
}
