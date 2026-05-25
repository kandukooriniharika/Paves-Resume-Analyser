package com.paves.resume_analyser.screening.result;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScreeningResultRepository extends JpaRepository<ScreeningResult, Long> {

    Optional<ScreeningResult> findByResumeId(Long resumeId);

    Page<ScreeningResult> findByCampaignIdOrderByOverallScoreDesc(Long campaignId, Pageable pageable);

    /** Non-paged version used for CSV/XLSX export. */
    List<ScreeningResult> findByCampaignIdOrderByOverallScoreDesc(Long campaignId);

    List<ScreeningResult> findTop10ByCampaignIdOrderByOverallScoreDesc(Long campaignId);

    long countByCampaignId(Long campaignId);

    long countByCampaignIdAndRecommendation(Long campaignId, Recommendation recommendation);

    long countByCampaignIdAndHrStatus(Long campaignId, String hrStatus);

    @Query("SELECT AVG(r.overallScore) FROM ScreeningResult r WHERE r.campaign.id = :cid")
    Double avgScoreByCampaignId(@Param("cid") Long campaignId);
}
