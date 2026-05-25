package com.paves.resume_analyser.screening.pipeline.layer1;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Layer 1 of the screening pipeline: fast keyword-match scoring.
 * Runs locally with no external calls, so it always produces a score.
 */
@Service
public class Layer1FilterService {

    /**
     * Computes a keyword match score (0–100) between the resume text and the
     * required + nice-to-have skills.
     *
     * <p>Base score = matched_required / total_required * 100.
     * Nice-to-have matches add up to 10 bonus points on top, capped at 100.
     */
    public double score(String extractedText,
                        List<String> requiredSkills,
                        List<String> niceToHaveSkills) {
        if (extractedText == null || requiredSkills.isEmpty()) return 0;
        String text = extractedText.toLowerCase();

        long matched = requiredSkills.stream()
                .filter(s -> text.contains(s.toLowerCase().trim()))
                .count();

        double baseScore = (double) matched / requiredSkills.size() * 100;

        double bonus = 0;
        if (niceToHaveSkills != null && !niceToHaveSkills.isEmpty()) {
            long niceMatched = niceToHaveSkills.stream()
                    .filter(s -> text.contains(s.toLowerCase().trim()))
                    .count();
            bonus = (double) niceMatched / niceToHaveSkills.size() * 10;
        }

        return Math.min(100, baseScore + bonus);
    }

    /** Returns the subset of {@code skills} that appear in the resume text. */
    public List<String> getMatchedSkills(String text, List<String> skills) {
        if (text == null || skills == null) return List.of();
        String lower = text.toLowerCase();
        return skills.stream()
                .filter(s -> lower.contains(s.toLowerCase().trim()))
                .collect(Collectors.toList());
    }

    /** Returns the subset of {@code skills} that are absent from the resume text. */
    public List<String> getMissingSkills(String text, List<String> skills) {
        if (text == null || skills == null) return skills != null ? skills : List.of();
        String lower = text.toLowerCase();
        return skills.stream()
                .filter(s -> !lower.contains(s.toLowerCase().trim()))
                .collect(Collectors.toList());
    }
}
