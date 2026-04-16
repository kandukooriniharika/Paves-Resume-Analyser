package com.paves.resume_analyser.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeUploadResponse> uploadResume(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(required = false) String targetRole) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }

        String fileName = StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "resume.pdf";
        ResumeUploadResponse response = buildResponse(fileName, file.getSize(), targetRole);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{resumeId}")
    public ResumePreview getResume(@PathVariable String resumeId) {
        return new ResumePreview(
                resumeId,
                "sample-resume.pdf",
                "Backend Developer",
                82,
                List.of("Java", "Spring Boot", "SQL"),
                List.of("Docker", "System Design"));
    }

    private ResumeUploadResponse buildResponse(String fileName, long fileSize, String targetRole) {
        String normalizedFileName = fileName.toLowerCase();
        String suggestedRole = StringUtils.hasText(targetRole)
                ? targetRole.trim()
                : normalizedFileName.contains("frontend") ? "Frontend Developer" : "Backend Developer";

        int atsScore = normalizedFileName.contains("final") ? 88 : 81;

        return new ResumeUploadResponse(
                "resume-" + Math.abs(fileName.hashCode()),
                fileName,
                fileSize,
                suggestedRole,
                atsScore,
                List.of("Clear project descriptions", "Relevant technical skills"),
                List.of("Quantified impact", "Cloud deployment experience"),
                List.of("Backend Developer", "Full Stack Developer", "Software Engineer"));
    }

    public record ResumeUploadResponse(
            String resumeId,
            String fileName,
            long fileSize,
            String targetRole,
            int atsScore,
            List<String> strengths,
            List<String> improvementAreas,
            List<String> recommendedRoles) {
    }

    public record ResumePreview(
            String resumeId,
            String fileName,
            String targetRole,
            int atsScore,
            List<String> matchedSkills,
            List<String> missingSkills) {
    }
}
