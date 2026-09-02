package com.talentai.interview.controller;

import com.talentai.common.response.ListResponse;
import com.talentai.interview.dto.InterviewDtos.*;
import com.talentai.interview.service.InterviewService;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<InterviewStatusResponse> schedule(@Valid @RequestBody ScheduleInterviewRequest req,
                                                            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(interviewService.schedule(req, principal.getUserId()));
    }

    @GetMapping
    public ResponseEntity<ListResponse<InterviewResponse>> list(@RequestParam(required = false) Long interviewerId,
                                                                @RequestParam(required = false) String status) {
        return ResponseEntity.ok(interviewService.list(interviewerId, status));
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<InterviewResponse> get(@PathVariable Long interviewId) {
        return ResponseEntity.ok(interviewService.getInterview(interviewId));
    }

    @PatchMapping("/{interviewId}/reschedule")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<InterviewStatusResponse> reschedule(@PathVariable Long interviewId,
                                                              @Valid @RequestBody RescheduleRequest req,
                                                              @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(interviewService.reschedule(interviewId, req, principal.getUserId()));
    }

    @PatchMapping("/{interviewId}/cancel")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<InterviewStatusResponse> cancel(@PathVariable Long interviewId,
                                                          @RequestBody(required = false) CancelRequest req,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(interviewService.cancel(interviewId, req == null ? new CancelRequest(null) : req, principal.getUserId()));
    }

    @PostMapping("/{interviewId}/feedback")
    @PreAuthorize("hasAnyRole('INTERVIEWER','RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<FeedbackResponse> feedback(@PathVariable Long interviewId, @Valid @RequestBody FeedbackRequest req,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewService.submitFeedback(interviewId, req, principal.getUserId(), principal.getUserId()));
    }

    @GetMapping("/{interviewId}/feedback-summary")
    public ResponseEntity<FeedbackSummaryResponse> feedbackSummary(@PathVariable Long interviewId) {
        return ResponseEntity.ok(interviewService.feedbackSummary(interviewId));
    }
}
