package com.talentai.interview.service;

import com.talentai.application.entity.Application;
import com.talentai.application.repository.ApplicationRepository;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.common.response.ListResponse;
import com.talentai.interview.dto.InterviewDtos.*;
import com.talentai.interview.entity.Interview;
import com.talentai.interview.entity.InterviewCompetencyRating;
import com.talentai.interview.entity.InterviewFeedback;
import com.talentai.interview.repository.InterviewCompetencyRatingRepository;
import com.talentai.interview.repository.InterviewFeedbackRepository;
import com.talentai.interview.repository.InterviewRepository;
import com.talentai.job.entity.Job;
import com.talentai.job.repository.JobRepository;
import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final InterviewCompetencyRatingRepository ratingRepository;
    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    private static final List<String> RECOMMENDATION_ORDER = List.of("Strong Hire", "Hire", "Hold", "Reject");

    @Transactional
    public InterviewStatusResponse schedule(ScheduleInterviewRequest req, Long actorUserId) {
        applicationRepository.findByApplicationIdAndIsActiveTrue(req.applicationId())
                .ifPresent(a -> {
                    a.setApplicationStatus("Interview Scheduled");
                    a.setModifiedBy(actorUserId);
                    applicationRepository.save(a);
                });
        Interview interview = interviewRepository.save(Interview.builder()
                .applicationId(req.applicationId())
                .interviewerId(req.interviewerId())
                .interviewDate(parseDateTime(req.scheduledAt()))
                .interviewType(req.interviewType())
                .interviewMode(req.mode())
                .interviewStatus("Scheduled")
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        return new InterviewStatusResponse(interview.getInterviewId(), "Scheduled");
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterview(Long interviewId) {
        return toResponse(findOrThrow(interviewId));
    }

    @Transactional(readOnly = true)
    public ListResponse<InterviewResponse> list(Long interviewerId, String status) {
        List<InterviewResponse> data = interviewRepository.search(interviewerId, status).stream()
                .map(this::toResponse).toList();
        return ListResponse.of(data);
    }

    @Transactional
    public InterviewStatusResponse reschedule(Long interviewId, RescheduleRequest req, Long actorUserId) {
        Interview i = findOrThrow(interviewId);
        i.setInterviewDate(parseDateTime(req.newScheduledAt()));
        i.setInterviewStatus("Rescheduled");
        i.setModifiedBy(actorUserId);
        interviewRepository.save(i);
        return new InterviewStatusResponse(interviewId, "Rescheduled");
    }

    @Transactional
    public InterviewStatusResponse cancel(Long interviewId, CancelRequest req, Long actorUserId) {
        Interview i = findOrThrow(interviewId);
        i.setInterviewStatus("Cancelled");
        i.setModifiedBy(actorUserId);
        interviewRepository.save(i);
        return new InterviewStatusResponse(interviewId, "Cancelled");
    }

    @Transactional
    public FeedbackResponse submitFeedback(Long interviewId, FeedbackRequest req, Long interviewerId, Long actorUserId) {
        findOrThrow(interviewId);
        InterviewFeedback feedback = feedbackRepository.findByInterviewIdAndInterviewerId(interviewId, interviewerId)
                .orElseGet(() -> InterviewFeedback.builder()
                        .interviewId(interviewId).interviewerId(interviewerId).isActive(true).createdBy(actorUserId).build());
        feedback.setRecommendation(recommendationToDb(req.recommendation()));
        feedback.setComments(req.comments());
        feedback.setModifiedBy(actorUserId);
        feedback = feedbackRepository.save(feedback);

        // Replace competency ratings for this feedback.
        ratingRepository.deleteAll(ratingRepository.findByFeedbackId(feedback.getFeedbackId()));
        saveRating(feedback.getFeedbackId(), "Technical", req.technical(), actorUserId);
        saveRating(feedback.getFeedbackId(), "Communication", req.communication(), actorUserId);
        saveRating(feedback.getFeedbackId(), "Problem Solving", req.problemSolving(), actorUserId);
        saveRating(feedback.getFeedbackId(), "Domain Knowledge", req.domainKnowledge(), actorUserId);

        // Mark the interview completed once feedback is in.
        Interview i = findOrThrow(interviewId);
        i.setInterviewStatus("Completed");
        i.setModifiedBy(actorUserId);
        interviewRepository.save(i);

        return new FeedbackResponse(feedback.getFeedbackId(), interviewId, "Submitted");
    }

    @Transactional(readOnly = true)
    public FeedbackSummaryResponse feedbackSummary(Long interviewId) {
        List<InterviewFeedback> feedbacks = feedbackRepository.findByInterviewIdAndIsActiveTrue(interviewId);
        Map<Long, User> users = userRepository.findAllById(feedbacks.stream().map(InterviewFeedback::getInterviewerId).toList())
                .stream().collect(java.util.stream.Collectors.toMap(User::getUserId, u -> u));

        List<PanelistFeedback> panel = new ArrayList<>();
        for (InterviewFeedback f : feedbacks) {
            Map<String, Integer> ratings = new java.util.HashMap<>();
            ratingRepository.findByFeedbackId(f.getFeedbackId())
                    .forEach(r -> ratings.put(r.getCompetencyName(), r.getRating() == null ? null : (int) (short) r.getRating()));
            User u = users.get(f.getInterviewerId());
            String name = u == null ? "Interviewer #" + f.getInterviewerId() : u.getFirstName() + " " + u.getLastName();
            panel.add(new PanelistFeedback(f.getInterviewerId(), name, recommendationToApi(f.getRecommendation()),
                    ratings.get("Technical"), ratings.get("Communication"), ratings.get("Problem Solving"),
                    ratings.get("Domain Knowledge"), f.getComments()));
        }
        return new FeedbackSummaryResponse(interviewId, panel, consolidate(feedbacks));
    }

    // --- helpers ---

    private void saveRating(Long feedbackId, String competency, Integer rating, Long actorUserId) {
        if (rating == null) {
            return;
        }
        ratingRepository.save(InterviewCompetencyRating.builder()
                .feedbackId(feedbackId).competencyName(competency).rating(rating.shortValue())
                .createdBy(actorUserId).isActive(true).build());
    }

    private String consolidate(List<InterviewFeedback> feedbacks) {
        return feedbacks.stream()
                .map(InterviewFeedback::getRecommendation)
                .filter(java.util.Objects::nonNull)
                .min(java.util.Comparator.comparingInt(r -> {
                    int idx = RECOMMENDATION_ORDER.indexOf(r);
                    return idx < 0 ? Integer.MAX_VALUE : idx;
                }))
                .map(this::recommendationToApi)
                .orElse(null);
    }

    private InterviewResponse toResponse(Interview i) {
        String candidateName = null;
        String jobTitle = null;
        Application app = applicationRepository.findById(i.getApplicationId()).orElse(null);
        if (app != null) {
            Candidate c = candidateRepository.findById(app.getCandidateId()).orElse(null);
            if (c != null) {
                User u = userRepository.findById(c.getUserId()).orElse(null);
                if (u != null) {
                    candidateName = u.getFirstName() + " " + u.getLastName();
                }
            }
            jobTitle = jobRepository.findById(app.getJobId()).map(Job::getTitle).orElse(null);
        }
        return new InterviewResponse(i.getInterviewId(), i.getApplicationId(), i.getInterviewerId(),
                i.getInterviewDate() == null ? null : i.getInterviewDate().toString(), i.getInterviewStatus(),
                i.getInterviewType(), i.getInterviewMode(), null, candidateName, jobTitle);
    }

    private Interview findOrThrow(Long interviewId) {
        return interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + interviewId));
    }

    private String recommendationToDb(String api) {
        return "StrongHire".equals(api) ? "Strong Hire" : api;
    }

    private String recommendationToApi(String db) {
        return "Strong Hire".equals(db) ? "StrongHire" : db;
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value.length() > 16 ? value.substring(0, 16) : value);
            } catch (Exception e) {
                return LocalDateTime.now();
            }
        }
    }
}
