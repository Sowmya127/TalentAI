package com.talentai.candidate.integration;

import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.integration.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Repository-layer integration tests against real MySQL: persistence, the
 * custom finders on {@link com.talentai.candidate.repository.CandidateRepository},
 * pagination + sorting, and the schema's unique / foreign-key constraints
 * (V5__create_candidate.sql). Transactional so each test rolls back.
 */
@Transactional
@DisplayName("CandidateRepositoryIT")
class CandidateRepositoryIT extends IntegrationTestBase {

    private Candidate newCandidate(long userId) {
        return Candidate.builder()
                .userId(userId)
                .currentLocation("Bengaluru")
                .totalExperience(new BigDecimal("3.5"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("shouldPersistAndLoadCandidate")
    void shouldPersistAndLoadCandidate() {
        long userId = registerUser();

        Candidate saved = candidateRepository.save(newCandidate(userId));

        assertThat(saved.getCandidateId()).isNotNull();
        Optional<Candidate> found = candidateRepository.findById(saved.getCandidateId());
        assertThat(found).isPresent();
        assertThat(found.get().getCurrentLocation()).isEqualTo("Bengaluru");
        assertThat(found.get().getTotalExperience()).isEqualByComparingTo("3.5");
        // FKs are plain Long columns (no lazy associations) — scalar load, no proxy init needed.
        assertThat(found.get().getUserId()).isEqualTo(userId);
        assertThat(found.get().getIsActive()).isTrue();
    }

    @Test
    @DisplayName("shouldFindByUserId")
    void shouldFindByUserId() {
        long userId = registerUser();
        candidateRepository.save(newCandidate(userId));

        Optional<Candidate> found = candidateRepository.findByUserId(userId);

        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("shouldReportExistsByUserId")
    void shouldReportExistsByUserId() {
        long userId = registerUser();
        assertThat(candidateRepository.existsByUserId(userId)).isFalse();

        candidateRepository.save(newCandidate(userId));

        assertThat(candidateRepository.existsByUserId(userId)).isTrue();
        assertThat(candidateRepository.existsByUserId(9_999_999L)).isFalse();
    }

    @Test
    @DisplayName("shouldPaginateAndSortCandidates")
    void shouldPaginateAndSortCandidates() {
        for (int i = 0; i < 3; i++) {
            candidateRepository.save(newCandidate(registerUser()));
        }

        Page<Candidate> firstPage =
                candidateRepository.findAll(PageRequest.of(0, 2, Sort.by("candidateId").ascending()));

        assertThat(firstPage.getSize()).isEqualTo(2);
        assertThat(firstPage.getContent()).hasSizeLessThanOrEqualTo(2);
        assertThat(firstPage.getTotalElements()).isGreaterThanOrEqualTo(3);

        // Sorting: ids must be ascending within the page.
        List<Long> ids = firstPage.getContent().stream().map(Candidate::getCandidateId).toList();
        assertThat(ids).isSorted();

        // And descending sort returns the largest ids first.
        List<Candidate> desc =
                candidateRepository.findAll(PageRequest.of(0, 2, Sort.by("candidateId").descending())).getContent();
        assertThat(desc.stream().map(Candidate::getCandidateId).toList())
                .isSortedAccordingTo((a, b) -> Long.compare(b, a));
    }

    @Test
    @DisplayName("shouldRejectDuplicateUserId_UniqueConstraint")
    void shouldRejectDuplicateUserId_UniqueConstraint() {
        long userId = registerUser();
        candidateRepository.saveAndFlush(newCandidate(userId));

        // uq_candidate_user (user_id) — a second profile for the same user must fail at flush.
        assertThatThrownBy(() -> candidateRepository.saveAndFlush(newCandidate(userId)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("shouldRejectUnknownUserId_ForeignKeyConstraint")
    void shouldRejectUnknownUserId_ForeignKeyConstraint() {
        // fk_candidate_user — user_id must reference an existing app_user row.
        assertThatThrownBy(() -> candidateRepository.saveAndFlush(newCandidate(9_999_999L)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
