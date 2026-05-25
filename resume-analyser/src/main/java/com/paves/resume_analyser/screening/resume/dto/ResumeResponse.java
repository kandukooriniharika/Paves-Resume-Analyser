package com.paves.resume_analyser.screening.resume.dto;

import com.paves.resume_analyser.screening.resume.ScreeningResume;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeResponse {

    private Long id;
    private Long campaignId;
    private String originalFilename;
    private String fileUrl;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String status;
    private boolean ocrUsed;
    private boolean fraudFlagged;
    private LocalDateTime uploadedAt;
    private LocalDateTime parsedAt;

    /** Maps a ScreeningResume entity to its response DTO. */
    public static ResumeResponse from(ScreeningResume r) {
        return ResumeResponse.builder()
                .id(r.getId())
                .campaignId(r.getCampaign() != null ? r.getCampaign().getId() : null)
                .originalFilename(r.getOriginalFilename())
                .fileUrl(r.getFileUrl())
                .candidateName(r.getCandidateName())
                .candidateEmail(r.getCandidateEmail())
                .candidatePhone(r.getCandidatePhone())
                .status(r.getStatus().name())
                .ocrUsed(r.isOcrUsed())
                .fraudFlagged(r.isFraudFlagged())
                .uploadedAt(r.getUploadedAt())
                .parsedAt(r.getParsedAt())
                .build();
    }
}
