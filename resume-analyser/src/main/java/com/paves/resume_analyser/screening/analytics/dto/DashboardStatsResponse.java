package com.paves.resume_analyser.screening.analytics.dto;

import com.paves.resume_analyser.screening.result.dto.CandidateRankResponse;
import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    private long totalCampaigns;
    private long activeCampaigns;
    private long totalResumes;
    private long totalScreened;
    private Double avgScore;
    private long shortlistedCount;
    private long rejectedCount;
    private long fraudFlaggedCount;

    private List<CandidateRankResponse> topCandidates;

    /** e.g. {"DRAFT":5, "ACTIVE":3, "COMPLETED":12} */
    private Map<String, Long> campaignStatusDistribution;

    /** e.g. {"STRONGLY_RECOMMENDED":10, "RECOMMENDED":30, "MAYBE":15, "REJECT":5} */
    private Map<String, Long> recommendationDistribution;

    /** e.g. {"pending":12, "processing":5, "completed":80, "failed":3} */
    private Map<String, Long> queueHealth;
}
