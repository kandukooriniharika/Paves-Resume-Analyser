package com.paves.resume_analyser.screening.workflow;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MoveStageRequest {
    @NotNull
    private CandidateStage targetStage;
    private String rejectionReason;
}
