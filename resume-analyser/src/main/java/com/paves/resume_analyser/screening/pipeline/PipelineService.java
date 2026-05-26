package com.paves.resume_analyser.screening.pipeline;

import com.paves.resume_analyser.screening.ai.AIScreeningClient;
import com.paves.resume_analyser.screening.campaign.Campaign;
import com.paves.resume_analyser.screening.campaign.CampaignRepository;
import com.paves.resume_analyser.screening.ocr.ResumeParserService;
import com.paves.resume_analyser.screening.pipeline.layer1.Layer1FilterService;
import com.paves.resume_analyser.screening.result.Recommendation;
import com.paves.resume_analyser.screening.result.ScreeningResult;
import com.paves.resume_analyser.screening.result.ScreeningResultRepository;
import com.paves.resume_analyser.screening.resume.ResumeStatus;
import com.paves.resume_analyser.screening.resume.ScreeningResume;
import com.paves.resume_analyser.screening.resume.ScreeningResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineService {

    private final ScreeningResumeRepository resumeRepo;
    private final ScreeningResultRepository resultRepo;
    private final CampaignRepository campaignRepo;
    private final ResumeParserService parserService;
    private final Layer1FilterService layer1Service;
    private final AIScreeningClient aiClient;

    /**
     * Runs the full screening pipeline asynchronously for all PENDING/FAILED resumes
     * in the given campaign. Each resume is processed sequentially within the async thread.
     */
    @Async("screeningExecutor")
    public CompletableFuture<Void> runPipeline(String campaignId) {
        log.info("Pipeline started for campaign={}", campaignId);

        List<ScreeningResume> pendingResumes = resumeRepo.findByCampaignIdAndStatusIn(
                campaignId, List.of(ResumeStatus.PENDING, ResumeStatus.FAILED));

        Campaign campaign = campaignRepo.findById(campaignId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found: " + campaignId));

        for (ScreeningResume resume : pendingResumes) {
            try {
                processResume(resume, campaign);
            } catch (Exception e) {
                log.error("Pipeline failed for resume id={}: {}", resume.getId(), e.getMessage(), e);
                resume.setStatus(ResumeStatus.FAILED);
                resumeRepo.save(resume);
            }
        }

        log.info("Pipeline completed for campaign={}, processed={}", campaignId, pendingResumes.size());
        return CompletableFuture.completedFuture(null);
    }

    private void processResume(ScreeningResume resume, Campaign campaign) throws Exception {

        // ── Step 1: Text extraction ──────────────────────────────────────────
        resume.setStatus(ResumeStatus.PARSING);
        resumeRepo.save(resume);

        String text = resume.getExtractedText();
        if (text == null || text.isBlank()) {
            text = loadAndExtract(resume);
            resume.setExtractedText(text);
        }

        // ── Step 2: Layer 1 — keyword scoring ───────────────────────────────
        resume.setStatus(ResumeStatus.LAYER1);
        resumeRepo.save(resume);

        List<String> required = campaign.getRequiredSkillList();
        List<String> niceToHave = splitTrimmed(campaign.getNiceToHaveSkills());

        double layer1Score    = layer1Service.score(text, required, niceToHave);
        List<String> matched  = layer1Service.getMatchedSkills(text, required);
        List<String> missing  = layer1Service.getMissingSkills(text, required);

        // ── Step 3: Layer 2 — embedding similarity ──────────────────────────
        resume.setStatus(ResumeStatus.LAYER2);
        resumeRepo.save(resume);

        double layer2Score = 50.0;
        Map<String, Object> aiParseResult = Map.of();

        if (aiClient.isHealthy()) {
            aiParseResult = aiClient.parseResume(text, resume.getOriginalFilename());

            resume.setCandidateName((String) aiParseResult.getOrDefault("name", null));
            resume.setCandidateEmail((String) aiParseResult.getOrDefault("email", null));
            resume.setCandidatePhone((String) aiParseResult.getOrDefault("phone", null));

            List<Double> resumeEmbed = aiClient.getEmbedding(text, "resume");
            String jdText = campaign.getRoleName() + " "
                    + nullToEmpty(campaign.getJobDescription()) + " "
                    + nullToEmpty(campaign.getRequiredSkills());
            List<Double> jdEmbed = aiClient.getEmbedding(jdText, "jd");

            if (!resumeEmbed.isEmpty() && !jdEmbed.isEmpty()) {
                layer2Score = cosineSimilarity(resumeEmbed, jdEmbed) * 100;
            }
        }

        // ── Step 4: Layer 3 — Gemini AI scoring ─────────────────────────────
        resume.setStatus(ResumeStatus.AI_SCORING);
        resumeRepo.save(resume);

        double layer3Score     = 50.0;
        String aiFeedback      = "";
        String recommendation  = "MAYBE";
        String educationLevel  = "";
        String seniority       = "";
        int experienceYears    = 0;
        String strengths       = "";
        String weaknesses      = "";

        if (aiClient.isHealthy()) {
            Map<String, Object> scoreResult = aiClient.scoreResume(
                    aiParseResult, buildJdData(campaign), buildWeights(campaign));

            layer3Score    = toDouble(scoreResult.getOrDefault("layer3_score", 50.0));
            aiFeedback     = (String) scoreResult.getOrDefault("ai_feedback", "");
            recommendation = (String) scoreResult.getOrDefault("recommendation", "MAYBE");
            educationLevel = (String) scoreResult.getOrDefault("education_level", "");
            seniority      = (String) scoreResult.getOrDefault("seniority", "");
            experienceYears = toInt(scoreResult.getOrDefault("experience_years", 0));
            strengths      = joinList(scoreResult.getOrDefault("strengths", List.of()));
            weaknesses     = joinList(scoreResult.getOrDefault("weaknesses", List.of()));

            // Fraud detection
            Map<String, Object> fraudResult = aiClient.detectFraud(aiParseResult, text);
            boolean isFraud = Boolean.TRUE.equals(fraudResult.getOrDefault("is_fraud", false));
            resume.setFraudFlagged(isFraud);
        }

        // ── Composite score: 20% L1 + 30% L2 + 50% L3 ──────────────────────
        double atsScore     = (layer1Score * 0.20) + (layer2Score * 0.30) + (layer3Score * 0.50);
        double overallScore = atsScore;

        // ── Normalise recommendation enum value ──────────────────────────────
        Recommendation rec;
        try {
            rec = Recommendation.valueOf(recommendation.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            rec = Recommendation.MAYBE;
        }

        // ── Persist result ───────────────────────────────────────────────────
        ScreeningResult result = ScreeningResult.builder()
                .resume(resume)
                .campaign(campaign)
                .layer1Score(layer1Score)
                .layer2Score(layer2Score)
                .layer3Score(layer3Score)
                .atsScore(round1(atsScore))
                .overallScore(round1(overallScore))
                .recommendation(rec)
                .matchedSkills(String.join(",", matched))
                .missingSkills(String.join(",", missing))
                .strengths(strengths)
                .weaknesses(weaknesses)
                .aiFeedback(aiFeedback)
                .experienceYears(experienceYears)
                .educationLevel(educationLevel)
                .seniority(seniority)
                .build();

        resultRepo.save(result);
        resume.setStatus(ResumeStatus.COMPLETED);
        resume.setParsedAt(LocalDateTime.now());
        resumeRepo.save(resume);
        log.info("Processed resume id={} score={}", resume.getId(), round1(overallScore));
    }

    /**
     * Attempts to read the file from local storage and extract its text.
     * Falls back to an empty string if the file cannot be found.
     */
    private String loadAndExtract(ScreeningResume resume) {
        try {
            // fileUrl is "/api/screening/files/{storedName}" for local storage
            String filename = resume.getS3Key() != null ? resume.getS3Key()
                    : (resume.getFileUrl() != null
                    ? resume.getFileUrl().substring(resume.getFileUrl().lastIndexOf('/') + 1)
                    : null);
            if (filename == null) return "";

            Path path = Paths.get("./uploads/screening/", filename);
            if (!Files.exists(path)) return "";

            byte[] bytes = Files.readAllBytes(path);
            String originalName = resume.getOriginalFilename() != null
                    ? resume.getOriginalFilename() : filename;
            boolean usedOcr = false;
            String extracted = parserService.extractText(bytes, originalName);
            resume.setOcrUsed(usedOcr);
            return extracted;
        } catch (Exception e) {
            log.warn("Could not extract text from resume id={}: {}", resume.getId(), e.getMessage());
            return "";
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private double cosineSimilarity(List<Double> a, List<Double> b) {
        int len = Math.min(a.size(), b.size());
        if (len == 0) return 0;
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < len; i++) {
            dot   += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }
        double denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom == 0 ? 0 : dot / denom;
    }

    private Map<String, Object> buildJdData(Campaign c) {
        Map<String, Object> jd = new HashMap<>();
        jd.put("role_name",        c.getRoleName());
        jd.put("job_description",  nullToEmpty(c.getJobDescription()));
        jd.put("required_skills",  nullToEmpty(c.getRequiredSkills()));
        jd.put("nice_to_have",     nullToEmpty(c.getNiceToHaveSkills()));
        jd.put("min_experience",   c.getMinExperience() != null ? c.getMinExperience() : 0);
        jd.put("max_experience",   c.getMaxExperience() != null ? c.getMaxExperience() : 0);
        return jd;
    }

    private Map<String, Object> buildWeights(Campaign c) {
        Map<String, Object> weights = new HashMap<>();
        if (c.getSkillWeightsJson() != null && !c.getSkillWeightsJson().isBlank()) {
            weights.put("custom", c.getSkillWeightsJson());
        }
        weights.put("layer1", 0.20);
        weights.put("layer2", 0.30);
        weights.put("layer3", 0.50);
        return weights;
    }

    private double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0.0; }
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return 0; }
    }

    @SuppressWarnings("unchecked")
    private String joinList(Object val) {
        if (val instanceof List<?> list) {
            return list.stream().map(Object::toString).collect(Collectors.joining(","));
        }
        return val != null ? val.toString() : "";
    }

    private List<String> splitTrimmed(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String nullToEmpty(String s) { return s != null ? s : ""; }

    private double round1(double val) { return Math.round(val * 10.0) / 10.0; }
}
