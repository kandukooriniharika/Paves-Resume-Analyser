package com.paves.resume_analyser.screening.analytics;

import com.paves.resume_analyser.screening.analytics.dto.CampaignAnalyticsResponse;
import com.paves.resume_analyser.screening.analytics.dto.DashboardStatsResponse;
import com.paves.resume_analyser.screening.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/screening/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboard(
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDashboardStats()));
    }

    @GetMapping("/campaign/{campaignId}")
    public ResponseEntity<ApiResponse<CampaignAnalyticsResponse>> getCampaignAnalytics(
            @PathVariable String campaignId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getCampaignAnalytics(campaignId)));
    }
}
