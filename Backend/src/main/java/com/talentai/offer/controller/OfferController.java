package com.talentai.offer.controller;

import com.talentai.offer.dto.OfferDtos.*;
import com.talentai.offer.service.OfferService;
import com.talentai.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('RECRUITER','HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<OfferStatusResponse> generate(@Valid @RequestBody GenerateOfferRequest req,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offerService.generate(req, principal.getUserId()));
    }

    @GetMapping("/{offerId}")
    public ResponseEntity<OfferResponse> get(@PathVariable Long offerId) {
        return ResponseEntity.ok(offerService.getOffer(offerId));
    }

    @PatchMapping("/{offerId}/approve")
    @PreAuthorize("hasAnyRole('HIRING_MANAGER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<OfferStatusResponse> approve(@PathVariable Long offerId, @Valid @RequestBody ApproveOfferRequest req,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(offerService.approve(offerId, req, principal.getUserId()));
    }

    @PatchMapping("/{offerId}/send")
    @PreAuthorize("hasAnyRole('RECRUITER','HR_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<OfferStatusResponse> send(@PathVariable Long offerId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(offerService.send(offerId, principal.getUserId()));
    }

    @PatchMapping("/{offerId}/accept")
    public ResponseEntity<OfferStatusResponse> accept(@PathVariable Long offerId,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(offerService.accept(offerId, principal.getUserId()));
    }

    @PatchMapping("/{offerId}/decline")
    public ResponseEntity<OfferStatusResponse> decline(@PathVariable Long offerId,
                                                       @RequestBody(required = false) DeclineRequest req,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(offerService.decline(offerId, req, principal.getUserId()));
    }
}
