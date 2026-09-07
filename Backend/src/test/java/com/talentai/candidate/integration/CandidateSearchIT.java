package com.talentai.candidate.integration;

import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Candidate "search" integration tests.
 *
 * <p><b>Scope note.</b> The candidate module exposes NO search / list / filter
 * REST endpoint (the controller only has /me, /{id}, and mutations) — candidate
 * listing lives in the User and Job modules instead. These tests therefore
 * validate the repository/data-access behaviour (filtering, pagination, sorting)
 * that a candidate-search feature would be built on, against real MySQL.
 */
@Transactional
@DisplayName("CandidateSearchIT")
class CandidateSearchIT extends IntegrationTestBase {

    private Candidate persist(long userId, String location, String experience) {
        return candidateRepository.save(Candidate.builder()
                .userId(userId)
                .currentLocation(location)
                .totalExperience(new BigDecimal(experience))
                .isActive(true)
                .build());
    }

    @Test
    @DisplayName("shouldFilterByUserId")
    void shouldFilterByUserId() {
        long targetUser = registerUser();
        persist(targetUser, "Pune", "4.0");
        persist(registerUser(), "Delhi", "2.0");
        persist(registerUser(), "Chennai", "8.0");

        Optional<Candidate> match = candidateRepository.findByUserId(targetUser);

        assertThat(match).isPresent();
        assertThat(match.get().getUserId()).isEqualTo(targetUser);
        assertThat(match.get().getCurrentLocation()).isEqualTo("Pune");
    }

    @Test
    @DisplayName("shouldPaginateThroughResults")
    void shouldPaginateThroughResults() {
        persist(registerUser(), "Pune", "4.0");
        persist(registerUser(), "Delhi", "2.0");

        Sort byId = Sort.by("candidateId").ascending();
        Page<Candidate> page0 = candidateRepository.findAll(PageRequest.of(0, 1, byId));
        Page<Candidate> page1 = candidateRepository.findAll(PageRequest.of(1, 1, byId));

        assertThat(page0.getContent()).hasSize(1);
        assertThat(page1.getContent()).hasSize(1);
        assertThat(page0.getTotalElements()).isGreaterThanOrEqualTo(2);
        // Distinct pages return distinct rows.
        assertThat(page0.getContent().get(0).getCandidateId())
                .isNotEqualTo(page1.getContent().get(0).getCandidateId());
    }

    @Test
    @DisplayName("shouldSortByExperienceDescending")
    void shouldSortByExperienceDescending() {
        persist(registerUser(), "Pune", "4.0");
        persist(registerUser(), "Delhi", "2.0");
        persist(registerUser(), "Chennai", "9.0");

        List<Candidate> sorted = candidateRepository
                .findAll(PageRequest.of(0, 5, Sort.by("totalExperience").descending()))
                .getContent();

        List<BigDecimal> experiences = sorted.stream().map(Candidate::getTotalExperience).toList();
        assertThat(experiences).isSortedAccordingTo((a, b) -> b.compareTo(a));
    }
}
