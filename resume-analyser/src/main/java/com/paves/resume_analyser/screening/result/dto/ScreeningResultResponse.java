package com.paves.resume_analyser.screening.result.dto;

import com.paves.resume_analyser.screening.result.ScreeningResult;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningResultResponse {

    private Long id;
    private Long resumeId;
    private Long campaignId;

    // From resume
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String originalFilename;

    // Scores
    private Double layer1Score;
    private Double layer2Score;
    private Double layer3Score;
    private Double atsScore;
    private Double overallScore;

    private String recommendation;

    private List<String> matchedSkillList;
    private List<String> missingSkillList;
    private List<String> strengthList;
    private List<String> weaknessList;

    private String aiFeedback;
    private Integer experienceYears;
    private String educationLevel;
    private String seniority;
    private String fraudDetails;

    // HR override
    private Double hrOverrideScore;
    private String hrNotes;
    private String hrStatus;
    private String hrOverrideBy;
    private LocalDateTime hrOverrideAt;

    private LocalDateTime createdAt;

    /** Builds the response DTO from a ScreeningResult entity. */
    public static ScreeningResultResponse from(ScreeningResult r) {
        return ScreeningResultResponse.builder()
                .id(r.getId())
                .resumeId(r.getResume() != null ? r.getResume().getId() : null)
                .campaignId(r.getCampaign() != null ? r.getCampaign().getId() : null)
                .candidateName(r.getResume() != null ? r.getResume().getCandidateName() : null)
                .candidateEmail(r.getResume() != null ? r.getResume().getCandidateEmail() : null)
                .candidatePhone(r.getResume() != null ? r.getResume().getCandidatePhone() : null)
                .originalFilename(r.getResume() != null ? r.getResume().getOriginalFilename() : null)
                .layer1Score(r.getLayer1Score())
                .layer2Score(r.getLayer2Score())
                .layer3Score(r.getLayer3Score())
                .atsScore(r.getAtsScore())
                .overallScore(r.getOverallScore())
                .recommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null)
                .matchedSkillList(splitCsv(r.getMatchedSkills()))
                .missingSkillList(splitCsv(r.getMissingSkills()))
                .strengthList(splitCsv(r.getStrengths()))
                .weaknessList(splitCsv(r.getWeaknesses()))
                .aiFeedback(r.getAiFeedback())
                .experienceYears(r.getExperienceYears())
                .educationLevel(r.getEducationLevel())
                .seniority(r.getSeniority())
                .fraudDetails(r.getFraudDetails())
                .hrOverrideScore(r.getHrOverrideScore())
                .hrNotes(r.getHrNotes())
                .hrStatus(r.getHrStatus())
                .hrOverrideBy(r.getHrOverrideBy())
                .hrOverrideAt(r.getHrOverrideAt())
                .createdAt(r.getCreatedAt())
                .build();
    }

    /** Splits a comma-separated string into a trimmed list; returns empty list for null input. */
    private static List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
