package com.talentai.approval.repository;

import com.talentai.approval.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {

    List<ApprovalHistory> findByEntityTypeAndEntityIdOrderByActionDateDesc(String entityType, Long entityId);
}
