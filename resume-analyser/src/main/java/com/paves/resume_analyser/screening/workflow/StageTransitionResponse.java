package com.paves.resume_analyser.screening.workflow;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StageTransitionResponse {
    private String resultId;
    private CandidateStage from;
    private CandidateStage to;
    private String changedBy;
}
