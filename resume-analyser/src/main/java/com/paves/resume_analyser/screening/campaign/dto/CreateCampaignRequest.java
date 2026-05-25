package com.paves.resume_analyser.screening.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {

    @NotBlank(message = "Role name is required")
    private String roleName;

    private String jobDescription;

    /** Comma-separated required skills, e.g. "Java,Spring Boot,PostgreSQL". */
    private String requiredSkills;

    private String niceToHaveSkills;

    private Integer minExperience;
    private Integer maxExperience;
    private Integer targetHeadcount;

    private String department;

    /** Null means the campaign applies to all branches. */
    private Long branchId;

    /** Optional JSON string for per-skill weights, e.g. {"Java":30,"Spring":20}. */
    private String skillWeightsJson;
}
