package com.paves.resume_analyser.screening.campaign.dto;

import com.paves.resume_analyser.screening.campaign.Campaign;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignResponse {

    private Long id;
    private String roleName;
    private String jobDescription;
    private String requiredSkills;
    private String niceToHaveSkills;
    private Integer minExperience;
    private Integer maxExperience;
    private Integer targetHeadcount;
    private String department;
    private Long branchId;

    /** String name of the CampaignStatus enum. */
    private String status;

    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Live stats ──────────────────────────────────────────────────────────

    private long totalResumes;
    private long completedResumes;
    private long pendingResumes;
    private long failedResumes;
    private Double avgScore;

    /** Name of the highest-scoring candidate; may be null if no results yet. */
    private String topCandidateName;

    /**
     * Builds a fully-populated response from a Campaign entity and pre-fetched stats.
     *
     * @param c            the persisted campaign
     * @param total        total resumes uploaded
     * @param completed    resumes with COMPLETED status
     * @param pending      resumes with PENDING status
     * @param failed       resumes with FAILED status
     * @param avgScore     average overall score across results (nullable)
     * @param topCandidate name of the top-ranked candidate (nullable)
     */
    public static CampaignResponse from(Campaign c,
                                        long total,
                                        long completed,
                                        long pending,
                                        long failed,
                                        Double avgScore,
                                        String topCandidate) {
        return CampaignResponse.builder()
                .id(c.getId())
                .roleName(c.getRoleName())
                .jobDescription(c.getJobDescription())
                .requiredSkills(c.getRequiredSkills())
                .niceToHaveSkills(c.getNiceToHaveSkills())
                .minExperience(c.getMinExperience())
                .maxExperience(c.getMaxExperience())
                .targetHeadcount(c.getTargetHeadcount())
                .department(c.getDepartment())
                .branchId(c.getBranchId())
                .status(c.getStatus().name())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .totalResumes(total)
                .completedResumes(completed)
                .pendingResumes(pending)
                .failedResumes(failed)
                .avgScore(avgScore)
                .topCandidateName(topCandidate)
                .build();
    }
}
