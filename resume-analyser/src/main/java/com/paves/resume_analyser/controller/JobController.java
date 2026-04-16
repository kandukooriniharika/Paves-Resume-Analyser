package com.paves.resume_analyser.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private static final List<JobRoleView> JOB_ROLES = List.of(
            new JobRoleView(
                    "backend-developer",
                    "Backend Developer",
                    "cse",
                    List.of("Java", "Spring Boot", "SQL", "REST APIs"),
                    "Build secure backend services and integrations"),
            new JobRoleView(
                    "frontend-developer",
                    "Frontend Developer",
                    "cse",
                    List.of("React", "JavaScript", "CSS", "API Integration"),
                    "Craft responsive web experiences and dashboards"),
            new JobRoleView(
                    "embedded-engineer",
                    "Embedded Engineer",
                    "ece",
                    List.of("Embedded C", "Microcontrollers", "RTOS", "Debugging"),
                    "Develop firmware for hardware-connected devices"));

    @GetMapping
    public List<JobRoleView> getJobRoles(@RequestParam(required = false) String branchId) {
        if (branchId == null || branchId.isBlank()) {
            return JOB_ROLES;
        }

        return JOB_ROLES.stream()
                .filter(role -> role.branchId().equalsIgnoreCase(branchId.trim()))
                .toList();
    }

    @GetMapping("/{jobId}")
    public JobRoleView getJobRole(@PathVariable String jobId) {
        return JOB_ROLES.stream()
                .filter(role -> role.id().equalsIgnoreCase(jobId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job role not found"));
    }

    @GetMapping("/recommended")
    public List<JobRoleView> recommendedRoles(@RequestParam(required = false) String skill) {
        if (skill == null || skill.isBlank()) {
            return JOB_ROLES.stream().limit(2).toList();
        }

        String normalizedSkill = skill.trim().toLowerCase();
        List<JobRoleView> matches = JOB_ROLES.stream()
                .filter(role -> role.requiredSkills()
                        .stream()
                        .anyMatch(requiredSkill -> requiredSkill.toLowerCase().contains(normalizedSkill)))
                .toList();

        return matches.isEmpty() ? JOB_ROLES.stream().limit(2).toList() : matches;
    }

    public record JobRoleView(
            String id,
            String name,
            String branchId,
            List<String> requiredSkills,
            String summary) {
    }
}
