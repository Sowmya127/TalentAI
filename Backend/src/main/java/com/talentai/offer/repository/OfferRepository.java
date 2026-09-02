package com.talentai.offer.repository;

import com.talentai.offer.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    boolean existsByApplicationId(Long applicationId);
}
