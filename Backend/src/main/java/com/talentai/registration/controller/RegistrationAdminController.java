package com.talentai.registration.controller;

import com.talentai.common.response.ListResponse;
import com.talentai.registration.dto.RegistrationDtos.*;
import com.talentai.registration.service.RegistrationService;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin approval module: review queue, details, approval history, approve/reject. */
@RestController
@RequestMapping("/v1/admin/registration-requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','HR_ADMIN')")
public class RegistrationAdminController {

    private final RegistrationService registrationService;

    @GetMapping
    public ResponseEntity<ListResponse<RegistrationRequestSummary>> queue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submittedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(registrationService.queue(status, search, page, size, sortBy, direction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistrationRequestDetail> detail(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.getDetail(id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ApprovalHistoryItem>> history(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.getHistory(id));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<RegistrationDecisionResponse> approve(@PathVariable Long id,
                                                                @RequestBody(required = false) ApproveRequest req,
                                                                @AuthenticationPrincipal UserPrincipal principal) {
        String comments = req == null ? null : req.comments();
        return ResponseEntity.ok(registrationService.approve(id, comments, principal.getUserId()));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<RegistrationDecisionResponse> reject(@PathVariable Long id,
                                                               @Valid @RequestBody RejectRequest req,
                                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(registrationService.reject(id, req.reason(), principal.getUserId()));
    }
}
