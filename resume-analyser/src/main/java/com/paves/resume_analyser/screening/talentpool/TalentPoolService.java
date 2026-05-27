package com.paves.resume_analyser.screening.talentpool;

import com.paves.resume_analyser.screening.ai.AIScreeningClient;
import com.paves.resume_analyser.screening.result.ScreeningResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TalentPoolService {

    private final TalentPoolRepository poolRepo;
    private final AIScreeningClient aiClient;

    /**
     * Upserts a candidate into the talent pool after screening completes.
     * If the email already exists the record is updated with the latest score.
     */
    @Transactional
    public TalentPool upsertFromResult(ScreeningResult result, CandidateSource source) {
        String email = result.getResume().getCandidateEmail();
        if (email == null || email.isBlank()) return null;

        TalentPool existing = poolRepo.findByEmail(email).orElse(null);
        if (existing != null) {
            existing.setLastScore(result.getOverallScore());
            existing.setScreeningCount(existing.getScreeningCount() + 1);
            existing.setLastScreenedAt(LocalDateTime.now());
            existing.setLatestResumeUrl(result.getResume().getFileUrl());
            return poolRepo.save(existing);
        }

        TalentPool entry = TalentPool.builder()
                .fullName(result.getResume().getCandidateName() != null
                        ? result.getResume().getCandidateName() : "Unknown")
                .email(email)
                .phone(result.getResume().getCandidatePhone())
                .skills(result.getMatchedSkills())
                .experienceYears(result.getExperienceYears())
                .educationLevel(result.getEducationLevel())
                .seniority(result.getSeniority())
                .latestResumeUrl(result.getResume().getFileUrl())
                .sourceCampaignId(result.getCampaign().getId())
                .source(source)
                .lastScore(result.getOverallScore())
                .lastScreenedAt(LocalDateTime.now())
                .build();

        TalentPool saved = poolRepo.save(entry);
        log.info("Talent pool upsert: email={} score={}", email, result.getOverallScore());
        return saved;
    }

    public Page<TalentPool> listAll(Pageable pageable) {
        return poolRepo.findAllByOrderByLastScoreDesc(pageable);
    }

    /** Keyword search across name, email, and skills. */
    public List<TalentPool> keywordSearch(String query) {
        return poolRepo.search(query);
    }

    /** Semantic search via FastAPI /ai/semantic-search. */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> semanticSearch(String query, String campaignId, int topK) {
        Map<String, Object> result = aiClient.semanticSearch(query, campaignId, topK);
        Object hits = result.get("results");
        if (hits instanceof List<?> list) return (List<Map<String, Object>>) list;
        return List.of();
    }

    public List<TalentPool> findByMinScore(double minScore) {
        return poolRepo.findByMinScore(minScore);
    }

    public List<TalentPool> findBySource(CandidateSource source) {
        return poolRepo.findBySource(source);
    }
}
