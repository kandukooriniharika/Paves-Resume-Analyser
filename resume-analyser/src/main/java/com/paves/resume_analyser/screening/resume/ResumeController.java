package com.paves.resume_analyser.screening.resume;

import com.paves.resume_analyser.screening.common.ApiResponse;
import com.paves.resume_analyser.screening.resume.dto.ResumeResponse;
import com.paves.resume_analyser.screening.resume.dto.UploadStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/screening/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeUploadService resumeUploadService;

    /**
     * Bulk upload endpoint.
     * Accepts one or more files (including ZIP archives) for a given campaign.
     */
    @PostMapping("/bulk-upload")
    public ResponseEntity<ApiResponse<List<ResumeResponse>>> bulkUpload(
            @RequestParam("campaignId") Long campaignId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) throws Exception {

        List<ResumeResponse> uploaded = resumeUploadService.bulkUpload(campaignId, files);
        return ResponseEntity.ok(ApiResponse.ok(
                uploaded.size() + " file(s) uploaded successfully", uploaded));
    }

    @GetMapping("/{campaignId}")
    public ResponseEntity<ApiResponse<List<ResumeResponse>>> listResumes(
            @PathVariable Long campaignId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(resumeUploadService.listResumes(campaignId)));
    }

    @GetMapping("/upload-status/{campaignId}")
    public ResponseEntity<ApiResponse<UploadStatusResponse>> getUploadStatus(
            @PathVariable Long campaignId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        return ResponseEntity.ok(ApiResponse.ok(resumeUploadService.getUploadStatus(campaignId)));
    }

    @DeleteMapping("/detail/{resumeId}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(
            @PathVariable Long resumeId,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String userName,
            @RequestHeader(value = "X-User-Role", defaultValue = "GENERAL") String userRole) {

        resumeUploadService.deleteResume(resumeId);
        return ResponseEntity.ok(ApiResponse.ok("Resume deleted", null));
    }
}
