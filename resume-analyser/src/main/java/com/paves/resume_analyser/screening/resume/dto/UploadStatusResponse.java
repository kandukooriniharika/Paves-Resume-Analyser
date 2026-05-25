package com.paves.resume_analyser.screening.resume.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadStatusResponse {

    private Long campaignId;
    private long total;
    private long parsing;
    private long layer1;
    private long layer2;
    private long aiScoring;
    private long completed;
    private long failed;
    private long fraudFlagged;

    /**
     * Percentage of resumes that have reached a terminal state (COMPLETED or FAILED).
     * Returns 0 when no resumes have been uploaded yet.
     */
    public int getProgressPercent() {
        if (total == 0) return 0;
        return (int) ((completed + failed) * 100 / total);
    }
}
