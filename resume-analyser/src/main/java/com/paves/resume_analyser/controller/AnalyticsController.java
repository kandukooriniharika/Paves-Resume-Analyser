package com.paves.resume_analyser.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @GetMapping("/dashboard")
    public DashboardAnalytics dashboard() {
        return new DashboardAnalytics(
                128,
                84,
                11,
                3,
                List.of(
                        new MetricPoint("Computer Science Engineering", 52),
                        new MetricPoint("Electronics and Communication Engineering", 38),
                        new MetricPoint("Mechanical Engineering", 21)),
                List.of(
                        new MetricPoint("Backend Developer", 34),
                        new MetricPoint("Frontend Developer", 29),
                        new MetricPoint("Embedded Engineer", 18)));
    }

    @GetMapping("/summary")
    public AnalyticsSummary summary(@RequestParam(required = false) String branchId) {
        if (branchId == null || branchId.isBlank()) {
            return new AnalyticsSummary("all", 80.2, 67, 21, 12);
        }

        return switch (branchId.trim().toLowerCase()) {
            case "cse" -> new AnalyticsSummary("cse", 84.5, 34, 11, 6);
            case "ece" -> new AnalyticsSummary("ece", 79.2, 19, 7, 3);
            default -> new AnalyticsSummary(branchId.trim().toLowerCase(), 76.8, 14, 3, 2);
        };
    }

    public record DashboardAnalytics(
            int totalResumes,
            int analysedResumes,
            int openJobRoles,
            int activeBranches,
            List<MetricPoint> branchDistribution,
            List<MetricPoint> topRoles) {
    }

    public record AnalyticsSummary(
            String branchId,
            double averageAtsScore,
            int shortlistedCandidates,
            int interviewReadyCandidates,
            int highDemandRoles) {
    }

    public record MetricPoint(String label, int value) {
    }
}
