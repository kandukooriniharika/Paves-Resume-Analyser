package com.paves.resume_analyser.screening.campaign;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, String> {

    Page<Campaign> findByStatus(CampaignStatus status, Pageable pageable);

    Page<Campaign> findByBranchIdAndStatus(Long branchId, CampaignStatus status, Pageable pageable);

    Page<Campaign> findByBranchId(Long branchId, Pageable pageable);

    long countByStatus(CampaignStatus status);

    long countByBranchId(Long branchId);

    java.util.List<Campaign> findTop5ByOrderByCreatedAtDesc();
}
