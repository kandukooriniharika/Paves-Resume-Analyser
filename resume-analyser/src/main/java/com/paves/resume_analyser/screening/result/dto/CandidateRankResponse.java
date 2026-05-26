package com.paves.resume_analyser.screening.result.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRankResponse {

    private int rank;
    private String resultId;
    private String resumeId;
    private String campaignId;
    private String roleName;
    private String candidateName;
    private String candidateEmail;
    private Double overallScore;
    private Double atsScore;
    private String recommendation;
    private String hrStatus;
    private List<String> matchedSkillList;
}
