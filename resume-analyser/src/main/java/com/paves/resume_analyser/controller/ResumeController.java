package com.paves.resume_analyser.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.paves.resume_analyser.service.ResumeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    /**
     * Full upload + AI analysis pipeline endpoint.
     * Accepts a PDF file, uploads to Cloudinary, extracts text, scores with Gemini.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file")           MultipartFile file,
            @RequestParam("candidateName")  String candidateName,
            @RequestParam("candidateEmail") String candidateEmail,
            @RequestParam(value = "candidatePhone", required = false) String candidatePhone,
            @RequestParam("branchId")       Long branchId,
            @RequestParam("jobRoleId")      Long jobRoleId
    ) {
        return ResponseEntity.ok(
                resumeService.uploadAndAnalyse(
                        file,
                        candidateName,
                        candidateEmail,
                        candidatePhone,
                        branchId,
                        jobRoleId
                )
        );
    }

    /**
     * Simple create (for quick testing without a file).
     */
    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam String name,
            @RequestParam Long branchId,
            @RequestParam Long jobId
    ) {
        return ResponseEntity.ok(resumeService.createResume(name, branchId, jobId));
    }

    /**
     * Get all resumes for a branch, ordered by upload date descending.
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(resumeService.getByBranch(branchId));
    }

    /**
     * Shortlist a resume by ID.
     */
    @PatchMapping("/{resumeId}/shortlist")
    public ResponseEntity<?> shortlist(
            @PathVariable Long resumeId,
            @RequestParam(required = false, defaultValue = "") String notes
    ) {
        return ResponseEntity.ok(resumeService.shortlist(resumeId, notes));
    }
}
