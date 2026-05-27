package com.paves.resume_analyser.screening.result;

import com.paves.resume_analyser.screening.workflow.CandidateStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScreeningResultRepository extends JpaRepository<ScreeningResult, String> {

    Optional<ScreeningResult> findByResumeId(String resumeId);

    Page<ScreeningResult> findByCampaignIdOrderByOverallScoreDesc(String campaignId, Pageable pageable);

    /** Non-paged version used for CSV/XLSX export. */
    List<ScreeningResult> findByCampaignIdOrderByOverallScoreDesc(String campaignId);

    List<ScreeningResult> findTop10ByCampaignIdOrderByOverallScoreDesc(String campaignId);

    long countByCampaignId(String campaignId);

    long countByCampaignIdAndRecommendation(String campaignId, Recommendation recommendation);

    long countByCampaignIdAndHrStatus(String campaignId, String hrStatus);

    List<ScreeningResult> findByCampaignIdAndCandidateStage(String campaignId, CandidateStage stage);

    long countByCampaignIdAndCandidateStage(String campaignId, CandidateStage stage);

    @Query("SELECT AVG(r.overallScore) FROM ScreeningResult r WHERE r.campaign.id = :cid")
    Double avgScoreByCampaignId(@Param("cid") String campaignId);
}
