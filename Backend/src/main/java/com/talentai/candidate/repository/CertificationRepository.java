package com.talentai.candidate.repository;

import com.talentai.candidate.entity.Certification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificationRepository extends JpaRepository<Certification, Long> {

    List<Certification> findByCandidateIdAndIsActiveTrue(Long candidateId);
}
