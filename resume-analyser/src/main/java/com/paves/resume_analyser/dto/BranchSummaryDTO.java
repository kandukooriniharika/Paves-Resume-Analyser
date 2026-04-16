package com.paves.resume_analyser.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BranchSummaryDTO {

    private Long branchId;
    private String branchName;

    private long totalResumes;
    private long shortlisted;
    private double avgScore;
    private long openPositions;
}