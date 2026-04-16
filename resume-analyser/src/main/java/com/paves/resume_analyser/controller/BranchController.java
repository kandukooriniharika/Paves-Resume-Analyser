package com.paves.resume_analyser.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private static final List<BranchView> BRANCHES = List.of(
            new BranchView(
                    "cse",
                    "Computer Science Engineering",
                    "Software systems, AI, and platform engineering",
                    List.of("Java", "Spring Boot", "React", "Data Structures"),
                    12,
                    84.5),
            new BranchView(
                    "ece",
                    "Electronics and Communication Engineering",
                    "Embedded systems, networking, and signal processing",
                    List.of("Embedded C", "VLSI", "MATLAB", "Networking"),
                    9,
                    79.2),
            new BranchView(
                    "mech",
                    "Mechanical Engineering",
                    "CAD, manufacturing, and production optimization",
                    List.of("AutoCAD", "SolidWorks", "Thermodynamics", "Lean"),
                    7,
                    76.8));

    @GetMapping
    public List<BranchView> getBranches() {
        return BRANCHES;
    }

    @GetMapping("/{branchId}")
    public BranchView getBranch(@PathVariable String branchId) {
        return BRANCHES.stream()
                .filter(branch -> branch.id().equalsIgnoreCase(branchId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
    }

    public record BranchView(
            String id,
            String name,
            String overview,
            List<String> highlightedSkills,
            int activeJobRoles,
            double averageAtsScore) {
    }
}
