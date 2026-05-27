package com.paves.resume_analyser.screening.intake;

import com.paves.resume_analyser.screening.common.ApiResponse;
import com.paves.resume_analyser.screening.talentpool.CandidateSource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Public-facing endpoint for the company careers page.
 * Secured by API key in the X-Api-Key header (configured in SecurityConfig).
 * Candidates submit a PDF directly — no portal login required.
 */
@RestController
@RequestMapping("/api/v1/public/applications")
@RequiredArgsConstructor
public class WebsiteApplicationController {

    private final IntakeService intakeService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> apply(
            @RequestParam String campaignId,
            @RequestPart("resume") MultipartFile resume) throws Exception {

        intakeService.ingest(
                campaignId,
                resume.getBytes(),
                resume.getOriginalFilename() != null ? resume.getOriginalFilename() : "resume.pdf",
                resume.getContentType(),
                CandidateSource.WEBSITE);

        return ResponseEntity.ok(ApiResponse.success(
                "Your application has been received and is being reviewed."));
    }
}
