package com.paves.resume_analyser.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.paves.resume_analyser.service.JobService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping("/{branchId}")
    public ResponseEntity<?> getJobs(@PathVariable Long branchId) {
        return ResponseEntity.ok(jobService.getByBranch(branchId));
    }
}