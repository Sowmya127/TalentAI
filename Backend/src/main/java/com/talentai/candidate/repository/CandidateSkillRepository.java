package com.talentai.candidate.repository;

import com.talentai.candidate.entity.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, Long> {

    List<CandidateSkill> findByCandidateIdAndIsActiveTrue(Long candidateId);

    /**
     * Bulk DELETE executed immediately (not a queued per-entity delete), so that
     * a subsequent re-insert of the same (candidate_id, skill_id) in the same
     * transaction — the "replace all skills" flow — cannot hit the unique
     * constraint due to Hibernate flushing inserts before deletes.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM CandidateSkill cs WHERE cs.candidateId = :candidateId")
    void deleteByCandidateId(@Param("candidateId") Long candidateId);
}
