package com.talentai.offer.repository;

import com.talentai.offer.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    boolean existsByApplicationId(Long applicationId);

    /** Indexed COUNT (ix_offer_offer_status) — avoids loading the whole table to count by status. */
    long countByOfferStatus(String offerStatus);
}
