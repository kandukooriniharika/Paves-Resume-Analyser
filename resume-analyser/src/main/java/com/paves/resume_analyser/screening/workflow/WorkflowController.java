package com.paves.resume_analyser.screening.workflow;

import com.paves.resume_analyser.screening.common.ApiResponse;
import com.paves.resume_analyser.screening.result.ScreeningResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Candidate pipeline stage management.
 * RECRUITER and HR_ADMIN can move candidates through stages.
 * HIRING_MANAGER can move from HM_REVIEW → INTERVIEW / REJECTED.
 */
@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    /** Move a candidate to the next pipeline stage. */
    @PatchMapping("/results/{resultId}/stage")
    public ResponseEntity<ApiResponse<StageTransitionResponse>> moveStage(
            @PathVariable String resultId,
            @Valid @RequestBody MoveStageRequest req,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName) {
        return ResponseEntity.ok(ApiResponse.success(
                workflowService.moveStage(resultId, req, userName)));
    }

    /** List all candidates in a given stage for a campaign. */
    @GetMapping("/campaigns/{campaignId}/stages/{stage}")
    public ResponseEntity<ApiResponse<List<ScreeningResult>>> getByStage(
            @PathVariable String campaignId,
            @PathVariable CandidateStage stage) {
        return ResponseEntity.ok(ApiResponse.success(
                workflowService.getByStage(campaignId, stage)));
    }

    /** Convenience: return all valid stage names. */
    @GetMapping("/stages")
    public ResponseEntity<ApiResponse<CandidateStage[]>> listStages() {
        return ResponseEntity.ok(ApiResponse.success(CandidateStage.values()));
    }
}
