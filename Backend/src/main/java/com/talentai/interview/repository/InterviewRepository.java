package com.talentai.interview.repository;

import com.talentai.interview.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    @Query("SELECT i FROM Interview i WHERE i.isActive = true "
            + "AND (:interviewerId IS NULL OR i.interviewerId = :interviewerId) "
            + "AND (:status IS NULL OR i.interviewStatus = :status) ORDER BY i.interviewDate ASC")
    List<Interview> search(@Param("interviewerId") Long interviewerId, @Param("status") String status);
}
