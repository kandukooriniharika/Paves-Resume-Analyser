package com.paves.resume_analyser.screening.campaign;

import com.paves.resume_analyser.screening.campaign.dto.CampaignResponse;
import com.paves.resume_analyser.screening.campaign.dto.CreateCampaignRequest;
import com.paves.resume_analyser.screening.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/screening/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CampaignResponse>>> listCampaigns(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(
                campaignService.listCampaigns(status, branchId, page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CampaignResponse>> createCampaign(
            @Valid @RequestBody CreateCampaignRequest req,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        CampaignResponse created = campaignService.createCampaign(req, userName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Campaign created", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> getCampaign(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(campaignService.getCampaignWithStats(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> updateCampaign(
            @PathVariable String id,
            @Valid @RequestBody CreateCampaignRequest req,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok("Campaign updated",
                campaignService.updateCampaign(id, req, userName)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Admin role required to delete campaigns"));
        }
        campaignService.deleteCampaign(id);
        return ResponseEntity.ok(ApiResponse.ok("Campaign deleted", null));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<CampaignResponse>> activateCampaign(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok("Campaign activated",
                campaignService.activateCampaign(id)));
    }

    @PostMapping("/{id}/pull-applications")
    public ResponseEntity<ApiResponse<String>> pullApplications(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(campaignService.pullApplications(id)));
    }
}
