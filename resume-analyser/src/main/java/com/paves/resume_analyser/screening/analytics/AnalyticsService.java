package com.paves.resume_analyser.screening.analytics;

import com.paves.resume_analyser.screening.analytics.dto.CampaignAnalyticsResponse;
import com.paves.resume_analyser.screening.analytics.dto.DashboardStatsResponse;
import com.paves.resume_analyser.screening.campaign.Campaign;
import com.paves.resume_analyser.screening.campaign.CampaignRepository;
import com.paves.resume_analyser.screening.campaign.CampaignService;
import com.paves.resume_analyser.screening.campaign.CampaignStatus;
import com.paves.resume_analyser.screening.result.Recommendation;
import com.paves.resume_analyser.screening.result.ScreeningResult;
import com.paves.resume_analyser.screening.result.ScreeningResultRepository;
import com.paves.resume_analyser.screening.result.dto.CandidateRankResponse;
import com.paves.resume_analyser.screening.resume.ResumeStatus;
import com.paves.resume_analyser.screening.resume.ScreeningResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CampaignRepository campaignRepository;
    private final ScreeningResumeRepository resumeRepository;
    private final ScreeningResultRepository resultRepository;
    private final CampaignService campaignService;

    /** Builds a system-wide dashboard aggregating stats across all campaigns. */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {

        long totalCampaigns  = campaignRepository.count();
        long activeCampaigns = campaignRepository.countByStatus(CampaignStatus.ACTIVE);
        long totalResumes    = resumeRepository.count();
        long totalScreened   = resultRepository.count();

        long shortlisted  = 0;
        long rejected     = 0;
        long fraudFlagged = 0;
        double scoreSum = 0;
        long scoreCount = 0;

        List<Campaign> allCampaigns = campaignRepository.findAll();
        for (Campaign c : allCampaigns) {
            shortlisted  += resultRepository.countByCampaignIdAndHrStatus(c.getId(), "SHORTLISTED");
            rejected     += resultRepository.countByCampaignIdAndHrStatus(c.getId(), "REJECTED");
            fraudFlagged += resumeRepository.countByCampaignIdAndFraudFlagged(c.getId(), true);
            Double avg = resultRepository.avgScoreByCampaignId(c.getId());
            if (avg != null) {
                scoreSum   += avg;
                scoreCount += 1;
            }
        }
        Double avgScore = scoreCount > 0 ? scoreSum / scoreCount : null;

        // Top candidates from all campaigns (fetch top-10 per campaign, merge by score)
        AtomicInteger rank = new AtomicInteger(1);
        List<CandidateRankResponse> rankedTop = allCampaigns.stream()
                .flatMap(c -> resultRepository.findTop10ByCampaignIdOrderByOverallScoreDesc(c.getId()).stream())
                .sorted((a, b) -> Double.compare(
                        b.getOverallScore() != null ? b.getOverallScore() : 0,
                        a.getOverallScore() != null ? a.getOverallScore() : 0))
                .limit(10)
                .map(r -> buildRank(r, rank.getAndIncrement()))
                .collect(Collectors.toList());

        // Campaign status distribution
        Map<String, Long> statusDist = new HashMap<>();
        for (CampaignStatus s : CampaignStatus.values()) {
            statusDist.put(s.name(), campaignRepository.countByStatus(s));
        }

        // Recommendation distribution across all campaigns
        Map<String, Long> recDist = new HashMap<>();
        for (Recommendation rec : Recommendation.values()) {
            long cnt = allCampaigns.stream()
                    .mapToLong(c -> resultRepository.countByCampaignIdAndRecommendation(c.getId(), rec))
                    .sum();
            recDist.put(rec.name(), cnt);
        }

        // Queue health
        long pending    = resumeRepository.count() - resultRepository.count();
        long processing = allCampaigns.stream()
                .mapToLong(c -> resumeRepository.countByCampaignIdAndStatusIn(
                        c.getId(), List.of(ResumeStatus.PARSING, ResumeStatus.LAYER1,
                                ResumeStatus.LAYER2, ResumeStatus.AI_SCORING)))
                .sum();
        long completed  = resultRepository.count();
        long failed     = allCampaigns.stream()
                .mapToLong(c -> resumeRepository.countByCampaignIdAndStatus(c.getId(), ResumeStatus.FAILED))
                .sum();

        Map<String, Long> queueHealth = Map.of(
                "pending",    Math.max(0, pending - processing),
                "processing", processing,
                "completed",  completed,
                "failed",     failed
        );

        return DashboardStatsResponse.builder()
                .totalCampaigns(totalCampaigns)
                .activeCampaigns(activeCampaigns)
                .totalResumes(totalResumes)
                .totalScreened(totalScreened)
                .avgScore(avgScore)
                .shortlistedCount(shortlisted)
                .rejectedCount(rejected)
                .fraudFlaggedCount(fraudFlagged)
                .topCandidates(rankedTop)
                .campaignStatusDistribution(statusDist)
                .recommendationDistribution(recDist)
                .queueHealth(queueHealth)
                .recentCampaigns(campaignService.listRecentCampaigns())
                .build();
    }

    /** Builds per-campaign analytics for the given campaign ID. */
    @Transactional(readOnly = true)
    public CampaignAnalyticsResponse getCampaignAnalytics(String campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found: " + campaignId));

        long total     = resumeRepository.countByCampaignId(campaignId);
        long completed = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.COMPLETED);
        long pending   = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.PENDING);
        long failed    = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.FAILED);
        long fraud     = resumeRepository.countByCampaignIdAndFraudFlagged(campaignId, true);
        long shortlist = resultRepository.countByCampaignIdAndHrStatus(campaignId, "SHORTLISTED");
        long rejected  = resultRepository.countByCampaignIdAndHrStatus(campaignId, "REJECTED");
        Double avg     = resultRepository.avgScoreByCampaignId(campaignId);

        Map<String, Long> recBreakdown = new HashMap<>();
        for (Recommendation rec : Recommendation.values()) {
            recBreakdown.put(rec.name(),
                    resultRepository.countByCampaignIdAndRecommendation(campaignId, rec));
        }

        return CampaignAnalyticsResponse.builder()
                .campaignId(campaignId)
                .roleName(campaign.getRoleName())
                .status(campaign.getStatus().name())
                .totalResumes(total)
                .completedResumes(completed)
                .pendingResumes(pending)
                .failedResumes(failed)
                .fraudFlagged(fraud)
                .avgScore(avg)
                .shortlisted(shortlist)
                .rejected(rejected)
                .recommendationBreakdown(recBreakdown)
                .build();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private CandidateRankResponse buildRank(ScreeningResult r, int rank) {
        List<String> matched = r.getMatchedSkills() != null
                ? Arrays.stream(r.getMatchedSkills().split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList())
                : List.of();
        return CandidateRankResponse.builder()
                .rank(rank)
                .resultId(r.getId())
                .resumeId(r.getResume() != null ? r.getResume().getId() : null)
                .campaignId(r.getCampaign() != null ? r.getCampaign().getId() : null)
                .roleName(r.getCampaign() != null ? r.getCampaign().getRoleName() : null)
                .candidateName(r.getResume() != null ? r.getResume().getCandidateName() : null)
                .candidateEmail(r.getResume() != null ? r.getResume().getCandidateEmail() : null)
                .overallScore(r.getOverallScore())
                .atsScore(r.getAtsScore())
                .recommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null)
                .hrStatus(r.getHrStatus())
                .matchedSkillList(matched)
                .build();
    }

    /** Overload that accepts a CandidateRankResponse (already built) and re-assigns the rank. */
    private CandidateRankResponse buildRank(CandidateRankResponse r, int rank) {
        return CandidateRankResponse.builder()
                .rank(rank)
                .resultId(r.getResultId())
                .resumeId(r.getResumeId())
                .campaignId(r.getCampaignId())
                .roleName(r.getRoleName())
                .candidateName(r.getCandidateName())
                .candidateEmail(r.getCandidateEmail())
                .overallScore(r.getOverallScore())
                .atsScore(r.getAtsScore())
                .recommendation(r.getRecommendation())
                .hrStatus(r.getHrStatus())
                .matchedSkillList(r.getMatchedSkillList())
                .build();
    }
}
