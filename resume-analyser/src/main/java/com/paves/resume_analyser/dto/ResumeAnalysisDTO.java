package com.paves.resume_analyser.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data               // generates getters, setters, equals, hashCode, toString
@Builder            // generates builder() — DO NOT write this method manually
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisDTO {

    private Integer atsScore;
    private Integer skillMatchScore;
    private Integer overallScore;

    private String matchedSkills;
    private String missingSkills;
    private String suggestions;
    private String strengths;
    private String aiSummary;
}