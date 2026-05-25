package com.paves.resume_analyser.screening.pipeline;

import com.paves.resume_analyser.screening.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/screening/run")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    /**
     * Starts the async screening pipeline for the given campaign.
     * Returns 202 Accepted immediately; the pipeline runs in the background.
     */
    @PostMapping("/{campaignId}")
    public ResponseEntity<ApiResponse<String>> runPipeline(
            @PathVariable Long campaignId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        pipelineService.runPipeline(campaignId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Pipeline started for campaign " + campaignId,
                        "Processing in background"));
    }
}
