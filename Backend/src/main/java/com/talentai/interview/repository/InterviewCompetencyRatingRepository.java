package com.talentai.interview.repository;

import com.talentai.interview.entity.InterviewCompetencyRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewCompetencyRatingRepository extends JpaRepository<InterviewCompetencyRating, Long> {

    List<InterviewCompetencyRating> findByFeedbackId(Long feedbackId);
}
