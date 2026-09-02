package com.talentai.job.repository;

import com.talentai.job.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {

    List<JobSkill> findByJobIdAndIsActiveTrue(Long jobId);

    void deleteByJobId(Long jobId);
}
