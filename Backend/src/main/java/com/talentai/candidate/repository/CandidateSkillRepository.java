package com.talentai.candidate.repository;

import com.talentai.candidate.entity.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, Long> {

    List<CandidateSkill> findByCandidateIdAndIsActiveTrue(Long candidateId);

    void deleteByCandidateId(Long candidateId);
}
