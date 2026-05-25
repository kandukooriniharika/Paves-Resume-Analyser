package com.paves.resume_analyser.screening.result;

import com.paves.resume_analyser.screening.common.ApiResponse;
import com.paves.resume_analyser.screening.result.dto.CandidateRankResponse;
import com.paves.resume_analyser.screening.result.dto.HROverrideRequest;
import com.paves.resume_analyser.screening.result.dto.ScreeningResultResponse;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/screening/results")
@RequiredArgsConstructor
public class ScreeningResultController {

    private final ScreeningResultService resultService;

    @GetMapping("/{campaignId}")
    public ResponseEntity<ApiResponse<Page<ScreeningResultResponse>>> getResults(
            @PathVariable Long campaignId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(resultService.getResults(campaignId, page, size)));
    }

    @GetMapping("/{campaignId}/top")
    public ResponseEntity<ApiResponse<List<CandidateRankResponse>>> getTopCandidates(
            @PathVariable Long campaignId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(resultService.getTopCandidates(campaignId)));
    }

    @GetMapping("/detail/{resultId}")
    public ResponseEntity<ApiResponse<ScreeningResultResponse>> getResultDetail(
            @PathVariable Long resultId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(resultService.getResultDetail(resultId)));
    }

    @PatchMapping("/{resultId}/override")
    public ResponseEntity<ApiResponse<ScreeningResultResponse>> hrOverride(
            @PathVariable Long resultId,
            @Valid @RequestBody HROverrideRequest req,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok("Override applied",
                resultService.hrOverride(resultId, req, userName)));
    }

    @PostMapping("/{resultId}/shortlist")
    public ResponseEntity<ApiResponse<ScreeningResultResponse>> shortlist(
            @PathVariable Long resultId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok("Candidate shortlisted",
                resultService.shortlist(resultId, userName)));
    }

    @PostMapping("/{resultId}/reject")
    public ResponseEntity<ApiResponse<ScreeningResultResponse>> reject(
            @PathVariable Long resultId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok("Candidate rejected",
                resultService.reject(resultId, userName)));
    }

    /**
     * Exports campaign results as CSV or XLSX.
     * Returns a file download response with the appropriate Content-Disposition header.
     */
    @GetMapping("/{campaignId}/export")
    public ResponseEntity<byte[]> export(
            @PathVariable Long campaignId,
            @RequestParam(defaultValue = "csv") String format,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) throws Exception {

        byte[] data = resultService.export(campaignId, format);

        String filename;
        MediaType contentType;
        if ("xlsx".equalsIgnoreCase(format)) {
            filename    = "campaign-" + campaignId + "-results.xlsx";
            contentType = MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            filename    = "campaign-" + campaignId + "-results.csv";
            contentType = MediaType.parseMediaType("text/csv");
        }

        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(data);
    }
}
