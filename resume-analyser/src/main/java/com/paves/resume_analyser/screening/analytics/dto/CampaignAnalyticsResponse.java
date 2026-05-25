package com.paves.resume_analyser.screening.analytics.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignAnalyticsResponse {

    private Long campaignId;
    private String roleName;
    private String status;

    private long totalResumes;
    private long completedResumes;
    private long pendingResumes;
    private long failedResumes;
    private long fraudFlagged;

    private Double avgScore;
    private long shortlisted;
    private long rejected;

    /** e.g. {"STRONGLY_RECOMMENDED":5, "RECOMMENDED":20, "MAYBE":8, "REJECT":3} */
    private Map<String, Long> recommendationBreakdown;

    /**
     * Percentage of resumes in a terminal state (COMPLETED or FAILED).
     * Returns 0 when totalResumes is 0.
     */
    public int getProgressPercent() {
        if (totalResumes == 0) return 0;
        return (int) ((completedResumes + failedResumes) * 100 / totalResumes);
    }
}
