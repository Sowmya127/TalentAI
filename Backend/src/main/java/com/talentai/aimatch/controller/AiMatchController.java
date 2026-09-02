package com.talentai.aimatch.controller;

import com.talentai.aimatch.dto.AiMatchDtos.*;
import com.talentai.aimatch.service.AiMatchService;
import com.talentai.common.response.ListResponse;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class AiMatchController {

    private final AiMatchService aiMatchService;

    @PostMapping("/ai/candidate-match")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<MatchResult> match(@Valid @RequestBody MatchRequest req,
                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(aiMatchService.match(req.candidateId(), req.jobId(), principal.getUserId()));
    }

    @GetMapping("/jobs/{jobId}/ranking")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<ListResponse<RankedCandidate>> ranking(@PathVariable Long jobId,
                                                                 @RequestParam(required = false) String sortBy,
                                                                 @RequestParam(defaultValue = "1") int page,
                                                                 @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(aiMatchService.ranking(jobId, page, size));
    }

    @GetMapping("/jobs/{jobId}/skill-gap/{candidateId}")
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<SkillGap> skillGap(@PathVariable Long jobId, @PathVariable Long candidateId) {
        return ResponseEntity.ok(aiMatchService.skillGap(jobId, candidateId));
    }
}
