package com.talentai.candidate.repository;

import com.talentai.candidate.entity.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Long> {

    List<WorkExperience> findByCandidateIdAndIsActiveTrue(Long candidateId);
}
