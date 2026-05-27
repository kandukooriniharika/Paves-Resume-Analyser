package com.paves.resume_analyser.screening.jd;

import com.paves.resume_analyser.screening.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * JD Management — HR_ADMIN only.
 * Supports text-paste, file upload (PDF/DOCX), versioning, and status management.
 */
@RestController
@RequestMapping("/api/jd")
@RequiredArgsConstructor
public class JobDescriptionController {

    private final JobDescriptionService jdService;

    /** Create a JD from pasted text. */
    @PostMapping("/text")
    public ResponseEntity<ApiResponse<JobDescription>> createFromText(
            @RequestParam String title,
            @RequestParam(required = false) String department,
            @RequestParam String rawText,
            @RequestParam(required = false) String scoringWeights,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String user) {
        return ResponseEntity.ok(ApiResponse.success(
                jdService.createFromText(title, department, rawText, scoringWeights, user)));
    }

    /** Create a JD from an uploaded PDF or DOCX file. */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<JobDescription>> createFromFile(
            @RequestParam String title,
            @RequestParam(required = false) String department,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String scoringWeights,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String user) throws Exception {
        return ResponseEntity.ok(ApiResponse.success(
                jdService.createFromFile(title, department, file, scoringWeights, user)));
    }

    /** Create a new version of an existing JD. */
    @PostMapping("/{id}/version")
    public ResponseEntity<ApiResponse<JobDescription>> newVersion(
            @PathVariable String id,
            @RequestParam(required = false) String title,
            @RequestParam String newText,
            @RequestParam(required = false) String scoringWeights,
            @RequestHeader(value = "X-User-Name", defaultValue = "system") String user) {
        return ResponseEntity.ok(ApiResponse.success(
                jdService.createNewVersion(id, title, newText, scoringWeights, user)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobDescription>>> listAll() {
        return ResponseEntity.ok(ApiResponse.success(jdService.listAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<JobDescription>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(jdService.listActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDescription>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(jdService.getById(id)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<JobDescription>> activate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(jdService.activate(id)));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<JobDescription>> archive(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(jdService.archive(id)));
    }
}
