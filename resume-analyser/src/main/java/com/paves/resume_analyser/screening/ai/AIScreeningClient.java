package com.paves.resume_analyser.screening.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;

import java.util.List;
import java.util.Map;

/**
 * Synchronous client for the Python FastAPI AI screening service.
 * All methods use {@code .block()} because the pipeline already runs
 * inside a dedicated {@code @Async} thread pool ({@code screeningExecutor}).
 */
@Slf4j
@Service
public class AIScreeningClient {

    private final WebClient client;

    public AIScreeningClient(
            @Value("${ai.service.url:http://localhost:8000}") String aiUrl) {
        this.client = WebClient.builder()
                .baseUrl(aiUrl)
                .build();
    }

    /**
     * Calls {@code POST /ai/parse-resume} with the extracted resume text.
     * Returns a map containing candidate fields (name, email, phone, skills, etc.).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> parseResume(String extractedText, String filename) {
        try {
            Map<String, Object> body = Map.of(
                    "extracted_text", extractedText,
                    "filename", filename != null ? filename : ""
            );
            Map<String, Object> result = client.post()
                    .uri("/ai/parse-resume")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null ? result : Map.of();
        } catch (WebClientException e) {
            log.warn("parseResume call failed: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Calls {@code POST /ai/layer2-embed} to obtain a text embedding vector.
     *
     * @param text the text to embed
     * @param type "resume" or "jd"
     * @return embedding vector; empty list on failure
     */
    @SuppressWarnings("unchecked")
    public List<Double> getEmbedding(String text, String type) {
        try {
            Map<String, Object> body = Map.of("text", text, "type", type);
            Map<String, Object> result = client.post()
                    .uri("/ai/layer2-embed")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (result != null && result.containsKey("embedding")) {
                return (List<Double>) result.get("embedding");
            }
            return List.of();
        } catch (WebClientException e) {
            log.warn("getEmbedding call failed: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Calls {@code POST /ai/score-resume} with parsed resume data, JD data, and weights.
     * Returns a map with scoring fields (layer3_score, recommendation, ai_feedback, etc.).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> scoreResume(Map<String, Object> resumeData,
                                           Map<String, Object> jdData,
                                           Map<String, Object> weights) {
        try {
            Map<String, Object> body = Map.of(
                    "resume_data", resumeData,
                    "jd_data", jdData,
                    "weights", weights
            );
            Map<String, Object> result = client.post()
                    .uri("/ai/score-resume")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null ? result : Map.of();
        } catch (WebClientException e) {
            log.warn("scoreResume call failed: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Calls {@code POST /ai/detect-fraud} to identify suspicious resume signals.
     * Returns a map containing at minimum {@code is_fraud} (boolean) and {@code details}.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> detectFraud(Map<String, Object> resumeData, String extractedText) {
        try {
            Map<String, Object> body = Map.of(
                    "resume_data", resumeData,
                    "extracted_text", extractedText != null ? extractedText : ""
            );
            Map<String, Object> result = client.post()
                    .uri("/ai/detect-fraud")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null ? result : Map.of();
        } catch (WebClientException e) {
            log.warn("detectFraud call failed: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Calls {@code POST /ai/check-duplicate} with the resume embedding and campaign ID.
     * Returns {@code true} if the resume is a near-duplicate of an existing one in the campaign.
     */
    @SuppressWarnings("unchecked")
    public boolean checkDuplicate(List<Double> embedding, String campaignId) {
        try {
            Map<String, Object> body = Map.of(
                    "embedding", embedding,
                    "campaign_id", campaignId
            );
            Map<String, Object> result = client.post()
                    .uri("/ai/check-duplicate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null && Boolean.TRUE.equals(result.get("is_duplicate"));
        } catch (WebClientException e) {
            log.warn("checkDuplicate call failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calls {@code POST /ai/parse-jd} with the raw JD text.
     * Returns extracted fields: required_skills, nice_to_have, min_experience, max_experience.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> parseJd(String jdText) {
        try {
            Map<String, Object> body = Map.of("jd_text", jdText);
            Map<String, Object> result = client.post()
                    .uri("/ai/parse-jd")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null ? result : Map.of();
        } catch (WebClientException e) {
            log.warn("parseJd call failed: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Calls {@code POST /ai/semantic-search} to find candidates matching a natural-language query.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> semanticSearch(String query, String campaignId, int topK) {
        try {
            Map<String, Object> body = java.util.HashMap.newHashMap(3);
            body.put("query", query);
            if (campaignId != null) body.put("campaign_id", campaignId);
            body.put("top_k", topK);
            Map<String, Object> result = client.post()
                    .uri("/ai/semantic-search")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null ? result : Map.of();
        } catch (WebClientException e) {
            log.warn("semanticSearch call failed: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Performs a lightweight health check against {@code GET /health}.
     *
     * @return true if the AI service responds with HTTP 2xx
     */
    public boolean isHealthy() {
        try {
            client.get()
                    .uri("/health")
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (Exception e) {
            log.debug("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
