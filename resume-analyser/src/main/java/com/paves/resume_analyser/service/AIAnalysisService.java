package com.paves.resume_analyser.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paves.resume_analyser.dto.ResumeAnalysisDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIAnalysisService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    /**
     * Sends extracted resume text to Gemini and returns a structured analysis.
     * FIX: Was a dummy stub — now calls real Gemini 1.5 Flash API.
     *
     * @param resumeText   the plain text extracted from the PDF
     * @param jobTitle     the job role title (for role-matched scoring)
     * @param branchName   the Paves branch (HYD / US / DXB / SGP / PNQ)
     * @param requiredSkills comma-separated required skills for this role
     */
    public ResumeAnalysisDTO analyze(String resumeText, String jobTitle,
                                     String branchName, String requiredSkills) {
        String prompt = buildPrompt(resumeText, jobTitle, branchName, requiredSkills);

        try {
            // Build Gemini request body
            Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                    Map.of("parts", new Object[]{
                        Map.of("text", prompt)
                    })
                },
                "generationConfig", Map.of(
                    "temperature", 0.2,
                    "maxOutputTokens", 1500
                )
            );

            String rawResponse = webClient.post()
                    .uri(geminiApiUrl + "?key=" + geminiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseGeminiResponse(rawResponse);

        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            // Return safe fallback so upload doesn't fail
            return buildFallback();
        }
    }

    // Overload for callers that don't have job detail yet (backward compat)
    public ResumeAnalysisDTO analyze(String resumeText) {
        return analyze(resumeText, "General Role", "HYD", "");
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private String buildPrompt(String resumeText, String jobTitle,
                                String branchName, String requiredSkills) {
        return """
            You are the AI hiring assistant for Paves Technologies, a global IT outsourcing company
            with offices in Hyderabad, USA, Dubai, Singapore, and Pune.

            Analyse the following resume for the position of: %s
            Branch: %s
            Required Skills for this role: %s

            Resume Text:
            ---
            %s
            ---

            Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
            {
              "atsScore": <integer 0-100, how well resume passes ATS keyword matching>,
              "skillMatchScore": <integer 0-100, how well candidate skills match required skills>,
              "overallScore": <integer 0-100, weighted combined score>,
              "matchedSkills": "<comma-separated list of skills found in resume that match requirements>",
              "missingSkills": "<comma-separated list of required skills NOT found in resume>",
              "strengths": "<2-3 key strengths of this candidate for the role>",
              "suggestions": "<2-3 specific, actionable improvements the candidate should make>",
              "aiSummary": "<3-4 sentence professional summary of this candidate's fit for the role at Paves Technologies %s branch>"
            }
            """.formatted(jobTitle, branchName, requiredSkills, resumeText, branchName);
    }

    private ResumeAnalysisDTO parseGeminiResponse(String rawResponse) throws Exception {
        JsonNode root = objectMapper.readTree(rawResponse);

        // Navigate: candidates[0] → content → parts[0] → text
        String text = root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText();

        // Strip markdown code fences if Gemini wraps in ```json
        text = text.replaceAll("```json", "").replaceAll("```", "").trim();

        JsonNode result = objectMapper.readTree(text);

        return ResumeAnalysisDTO.builder()
                .atsScore(result.path("atsScore").asInt(0))
                .skillMatchScore(result.path("skillMatchScore").asInt(0))
                .overallScore(result.path("overallScore").asInt(0))
                .matchedSkills(result.path("matchedSkills").asText(""))
                .missingSkills(result.path("missingSkills").asText(""))
                .strengths(result.path("strengths").asText(""))
                .suggestions(result.path("suggestions").asText(""))
                .aiSummary(result.path("aiSummary").asText(""))
                .build();
    }

    private ResumeAnalysisDTO buildFallback() {
        return ResumeAnalysisDTO.builder()
                .atsScore(0)
                .skillMatchScore(0)
                .overallScore(0)
                .matchedSkills("")
                .missingSkills("")
                .strengths("Analysis pending")
                .suggestions("Please retry analysis")
                .aiSummary("AI analysis could not be completed. Please retry.")
                .build();
    }
}