package com.paves.resume_analyser.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.paves.resume_analyser.service.ResumeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final ResumeService resumeService;

    /**
     * Get Top 10 resumes by score for a branch
     */
    @GetMapping("/top/{branchId}")
    public Object getTopResumes(@PathVariable Long branchId) {
        return resumeService.getTopResumes(branchId);
    }

    /**
     * Get all resumes for a branch (for analytics dashboard)
     */
    @GetMapping("/branch/{branchId}")
    public Object getAllResumes(@PathVariable Long branchId) {
        return resumeService.getByBranch(branchId);
    }
}