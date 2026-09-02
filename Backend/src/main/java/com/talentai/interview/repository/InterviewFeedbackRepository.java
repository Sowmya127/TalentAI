package com.talentai.interview.repository;

import com.talentai.interview.entity.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Long> {

    List<InterviewFeedback> findByInterviewIdAndIsActiveTrue(Long interviewId);

    Optional<InterviewFeedback> findByInterviewIdAndInterviewerId(Long interviewId, Long interviewerId);
}
