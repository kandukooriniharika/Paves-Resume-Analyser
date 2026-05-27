package com.paves.resume_analyser.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Arrays;

public enum UserRole {
    HR_ADMIN,       // Creates JDs, campaigns, configures weights, overrides AI decisions, full access
    RECRUITER,      // Uploads resumes, manages candidate pipeline, shortlists candidates
    HIRING_MANAGER; // Reviews shortlisted candidates, approves/rejects, finalises decisions

    @JsonCreator
    public static UserRole fromValue(String value) {
        if (value == null || value.isBlank()) return null;
        return Arrays.stream(values())
                .filter(r -> r.name().equalsIgnoreCase(value.replace("-", "_")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid role '" + value + "'. Allowed: HR_ADMIN, RECRUITER, HIRING_MANAGER"));
    }
}
