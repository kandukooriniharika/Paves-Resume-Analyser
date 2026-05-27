package com.paves.resume_analyser.screening.intake;

import com.paves.resume_analyser.screening.common.ApiResponse;
import com.paves.resume_analyser.screening.talentpool.CandidateSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

/**
 * Receives LinkedIn "Apply with LinkedIn" webhook events.
 *
 * Setup steps:
 *  1. Register your app at https://developer.linkedin.com/
 *  2. Request Talent Solutions API access (Apply Connect + RSC).
 *  3. Set the webhook URL to:  https://your-domain.com/webhooks/linkedin/apply
 *  4. Copy the webhook secret into LINKEDIN_WEBHOOK_SECRET env var.
 *
 * LinkedIn sends a POST with a JSON body and an X-LinkedIn-Signature header
 * (HMAC-SHA256 of the raw body, hex-encoded).
 */
@Slf4j
@RestController
@RequestMapping("/webhooks/linkedin")
@RequiredArgsConstructor
public class LinkedInWebhookController {

    private final IntakeService intakeService;

    @Value("${linkedin.webhook.secret:}")
    private String webhookSecret;

    private final WebClient httpClient = WebClient.create();

    /**
     * LinkedIn fires this for every "Easy Apply" submission.
     * Expected payload (simplified):
     * {
     *   "jobId": "campaign-id-here",
     *   "applicant": { "name": "...", "email": "..." },
     *   "resumeUrl": "https://..."   // temporary signed URL
     * }
     */
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<String>> handleApply(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-LinkedIn-Signature", required = false) String signature,
            @RequestHeader(value = "X-Raw-Body", required = false) String rawBody) {

        // Verify HMAC signature when secret is configured
        if (!webhookSecret.isBlank() && signature != null) {
            if (!verifySignature(rawBody != null ? rawBody : payload.toString(), signature)) {
                log.warn("LinkedIn webhook: invalid signature");
                return ResponseEntity.status(401)
                        .body(ApiResponse.error("Invalid webhook signature"));
            }
        }

        String campaignId = extractString(payload, "jobId");
        String resumeUrl  = extractString(payload, "resumeUrl");

        if (campaignId == null || resumeUrl == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Missing jobId or resumeUrl"));
        }

        try {
            byte[] resumeBytes = httpClient.get()
                    .uri(resumeUrl)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();

            if (resumeBytes == null || resumeBytes.length == 0) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Could not fetch resume from LinkedIn"));
            }

            intakeService.ingest(campaignId, resumeBytes,
                    "linkedin-resume.pdf", "application/pdf", CandidateSource.LINKEDIN);

            log.info("LinkedIn apply ingested: campaign={}", campaignId);
            return ResponseEntity.ok(ApiResponse.success("Resume queued for screening"));
        } catch (Exception e) {
            log.error("LinkedIn webhook processing failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Processing failed: " + e.getMessage()));
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private boolean verifySignature(String payload, String receivedSig) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(hash);
            return expected.equalsIgnoreCase(receivedSig);
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    private String extractString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof String s ? s : null;
    }
}
