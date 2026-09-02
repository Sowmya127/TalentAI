package com.talentai.offer.service;

import com.talentai.application.entity.Application;
import com.talentai.application.repository.ApplicationRepository;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.common.exception.BusinessException;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.job.entity.Job;
import com.talentai.job.repository.JobRepository;
import com.talentai.offer.dto.OfferDtos.*;
import com.talentai.offer.entity.Offer;
import com.talentai.offer.repository.OfferRepository;
import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    @Transactional
    public OfferStatusResponse generate(GenerateOfferRequest req, Long actorUserId) {
        Application app = applicationRepository.findByApplicationIdAndIsActiveTrue(req.applicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + req.applicationId()));
        if (!"Selected".equals(app.getApplicationStatus())) {
            throw new BusinessException("OFF-001", "Offer can only be created for a selected candidate.");
        }
        if (offerRepository.existsByApplicationId(req.applicationId())) {
            throw new DuplicateResourceException("An offer already exists for this application.");
        }
        Offer offer = offerRepository.save(Offer.builder()
                .applicationId(req.applicationId())
                .salary(req.compensation().baseSalary())
                .joiningDate(parseDate(req.joiningDate()))
                .offerStatus("Draft")
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        return new OfferStatusResponse(offer.getOfferId(), "Draft", null, null);
    }

    @Transactional(readOnly = true)
    public OfferResponse getOffer(Long offerId) {
        return toResponse(findOrThrow(offerId));
    }

    @Transactional
    public OfferStatusResponse approve(Long offerId, ApproveOfferRequest req, Long actorUserId) {
        Offer offer = findOrThrow(offerId);
        boolean approved = "Approved".equalsIgnoreCase(req.decision());
        offer.setOfferStatus(approved ? "Pending Approval" : "Rescinded");
        offer.setApprovedBy(actorUserId);
        offer.setModifiedBy(actorUserId);
        offerRepository.save(offer);
        return new OfferStatusResponse(offerId, OfferStatusMapper.toApi(offer.getOfferStatus()), null, null);
    }

    @Transactional
    public OfferStatusResponse send(Long offerId, Long actorUserId) {
        Offer offer = findOrThrow(offerId);
        if (!"Pending Approval".equals(offer.getOfferStatus())) {
            throw new BusinessException("OFF-002", "Offer must be approved before it can be sent.");
        }
        offer.setOfferStatus("Sent");
        offer.setModifiedBy(actorUserId);
        offerRepository.save(offer);
        updateApplicationStatus(offer.getApplicationId(), "Offer Sent", actorUserId);
        return new OfferStatusResponse(offerId, "Sent", java.time.LocalDateTime.now().toString(), null);
    }

    @Transactional
    public OfferStatusResponse accept(Long offerId, Long actorUserId) {
        Offer offer = findOrThrow(offerId);
        offer.setOfferStatus("Accepted");
        offer.setModifiedBy(actorUserId);
        offerRepository.save(offer);
        updateApplicationStatus(offer.getApplicationId(), "Hired", actorUserId);
        return new OfferStatusResponse(offerId, "Accepted", null, java.time.LocalDateTime.now().toString());
    }

    @Transactional
    public OfferStatusResponse decline(Long offerId, DeclineRequest req, Long actorUserId) {
        Offer offer = findOrThrow(offerId);
        offer.setOfferStatus("Declined");
        offer.setDeclineReason(req == null ? null : req.declineReason());
        offer.setModifiedBy(actorUserId);
        offerRepository.save(offer);
        return new OfferStatusResponse(offerId, "Declined", null, java.time.LocalDateTime.now().toString());
    }

    // --- helpers ---

    private void updateApplicationStatus(Long applicationId, String status, Long actorUserId) {
        applicationRepository.findByApplicationIdAndIsActiveTrue(applicationId).ifPresent(a -> {
            a.setApplicationStatus(status);
            a.setModifiedBy(actorUserId);
            applicationRepository.save(a);
        });
    }

    private OfferResponse toResponse(Offer offer) {
        String candidateName = null;
        String jobTitle = null;
        Application app = applicationRepository.findById(offer.getApplicationId()).orElse(null);
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
        // The offer table stores only a single salary; currency/variablePay
        // have no columns (V19), so they are defaulted on read.
        Compensation comp = new Compensation(offer.getSalary(), "INR", null);
        return new OfferResponse(offer.getOfferId(), offer.getApplicationId(),
                OfferStatusMapper.toApi(offer.getOfferStatus()), comp,
                offer.getJoiningDate() == null ? null : offer.getJoiningDate().toString(), candidateName, jobTitle);
    }

    private Offer findOrThrow(Long offerId) {
        return offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
        } catch (Exception e) {
            return null;
        }
    }
}
