package com.paves.resume_analyser.screening.talentpool;

import com.paves.resume_analyser.screening.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Talent Pool — reusable candidate database.
 * Accessible to HR_ADMIN and RECRUITER.
 */
@RestController
@RequestMapping("/api/talent-pool")
@RequiredArgsConstructor
public class TalentPoolController {

    private final TalentPoolService poolService;

    /** Paginated list sorted by score descending. */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TalentPool>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                poolService.listAll(PageRequest.of(page, size))));
    }

    /** Simple keyword search (name / email / skills). */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TalentPool>>> keywordSearch(
            @RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(poolService.keywordSearch(q)));
    }

    /**
     * Semantic search — finds candidates matching a natural-language query
     * (e.g. "backend engineers with Redis and AWS experience").
     */
    @GetMapping("/semantic-search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> semanticSearch(
            @RequestParam String q,
            @RequestParam(required = false) String campaignId,
            @RequestParam(defaultValue = "10") int topK) {
        return ResponseEntity.ok(ApiResponse.success(
                poolService.semanticSearch(q, campaignId, topK)));
    }

    /** Filter by minimum ATS score. */
    @GetMapping("/by-score")
    public ResponseEntity<ApiResponse<List<TalentPool>>> byScore(
            @RequestParam(defaultValue = "70") double minScore) {
        return ResponseEntity.ok(ApiResponse.success(poolService.findByMinScore(minScore)));
    }

    /** Filter by source channel (WEBSITE, LINKEDIN, NAUKRI, MANUAL). */
    @GetMapping("/by-source/{source}")
    public ResponseEntity<ApiResponse<List<TalentPool>>> bySource(
            @PathVariable CandidateSource source) {
        return ResponseEntity.ok(ApiResponse.success(poolService.findBySource(source)));
    }
}
