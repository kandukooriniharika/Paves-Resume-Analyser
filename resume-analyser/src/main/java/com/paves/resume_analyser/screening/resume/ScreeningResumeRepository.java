package com.paves.resume_analyser.screening.resume;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScreeningResumeRepository extends JpaRepository<ScreeningResume, String> {

    List<ScreeningResume> findByCampaignIdOrderByUploadedAtDesc(String campaignId);

    long countByCampaignId(String campaignId);

    long countByCampaignIdAndStatus(String campaignId, ResumeStatus status);

    long countByCampaignIdAndFraudFlagged(String campaignId, boolean fraudFlagged);

    /**
     * Returns resumes for a campaign whose status is in the provided list.
     * Used by the pipeline to find work items that need (re-)processing.
     */
    @Query("SELECT r FROM ScreeningResume r WHERE r.campaign.id = :cid AND r.status IN :statuses")
    List<ScreeningResume> findByCampaignIdAndStatusIn(
            @Param("cid") String campaignId,
            @Param("statuses") List<ResumeStatus> statuses);

    long countByCampaignIdAndStatusIn(String campaignId, List<ResumeStatus> statuses);
}
