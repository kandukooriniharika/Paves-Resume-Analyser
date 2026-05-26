package com.paves.resume_analyser.screening.campaign;

import com.paves.resume_analyser.screening.campaign.dto.CampaignResponse;
import com.paves.resume_analyser.screening.campaign.dto.CreateCampaignRequest;
import com.paves.resume_analyser.screening.result.ScreeningResultRepository;
import com.paves.resume_analyser.screening.resume.ResumeStatus;
import com.paves.resume_analyser.screening.resume.ScreeningResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final ScreeningResumeRepository resumeRepository;
    private final ScreeningResultRepository resultRepository;

    /** Lists campaigns with optional status and branchId filters. */
    public Page<CampaignResponse> listCampaigns(String status, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Campaign> campaigns;
        if (status != null && branchId != null) {
            campaigns = campaignRepository.findByBranchIdAndStatus(
                    branchId, CampaignStatus.valueOf(status.toUpperCase()), pageable);
        } else if (status != null) {
            campaigns = campaignRepository.findByStatus(
                    CampaignStatus.valueOf(status.toUpperCase()), pageable);
        } else if (branchId != null) {
            campaigns = campaignRepository.findByBranchId(branchId, pageable);
        } else {
            campaigns = campaignRepository.findAll(pageable);
        }

        return campaigns.map(this::buildResponse);
    }

    /** Fetches a single campaign with live stats. */
    public CampaignResponse getCampaignWithStats(String id) {
        Campaign campaign = getCampaignOrThrow(id);
        return buildResponse(campaign);
    }

    @Transactional
    public CampaignResponse createCampaign(CreateCampaignRequest req, String createdBy) {
        Campaign campaign = Campaign.builder()
                .roleName(req.getRoleName())
                .jobDescription(req.getJobDescription())
                .requiredSkills(req.getRequiredSkills())
                .niceToHaveSkills(req.getNiceToHaveSkills())
                .minExperience(req.getMinExperience())
                .maxExperience(req.getMaxExperience())
                .targetHeadcount(req.getTargetHeadcount())
                .department(req.getDepartment())
                .branchId(req.getBranchId())
                .skillWeightsJson(req.getSkillWeightsJson())
                .createdBy(createdBy)
                .status(CampaignStatus.DRAFT)
                .build();
        Campaign saved = campaignRepository.save(campaign);
        log.info("Created campaign id={} role='{}' by {}", saved.getId(), saved.getRoleName(), createdBy);
        return buildResponse(saved);
    }

    @Transactional
    public CampaignResponse updateCampaign(String id, CreateCampaignRequest req, String updatedBy) {
        Campaign campaign = getCampaignOrThrow(id);
        campaign.setRoleName(req.getRoleName());
        campaign.setJobDescription(req.getJobDescription());
        campaign.setRequiredSkills(req.getRequiredSkills());
        campaign.setNiceToHaveSkills(req.getNiceToHaveSkills());
        campaign.setMinExperience(req.getMinExperience());
        campaign.setMaxExperience(req.getMaxExperience());
        campaign.setTargetHeadcount(req.getTargetHeadcount());
        campaign.setDepartment(req.getDepartment());
        campaign.setBranchId(req.getBranchId());
        campaign.setSkillWeightsJson(req.getSkillWeightsJson());
        log.info("Updated campaign id={} by {}", id, updatedBy);
        return buildResponse(campaignRepository.save(campaign));
    }

    @Transactional
    public void deleteCampaign(String id) {
        Campaign campaign = getCampaignOrThrow(id);
        campaignRepository.delete(campaign);
        log.info("Deleted campaign id={}", id);
    }

    @Transactional
    public CampaignResponse activateCampaign(String id) {
        Campaign campaign = getCampaignOrThrow(id);
        campaign.setStatus(CampaignStatus.ACTIVE);
        log.info("Activated campaign id={}", id);
        return buildResponse(campaignRepository.save(campaign));
    }

    /** Placeholder for future recruitment-module integration. */
    public String pullApplications(String id) {
        getCampaignOrThrow(id);
        return "Pull from recruitment module initiated (integration pending)";
    }

    public List<CampaignResponse> listRecentCampaigns() {
        return campaignRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::buildResponse)
                .toList();
    }

    /**
     * Builds a {@link CampaignResponse} enriched with live counts and scores
     * fetched from the resume and result repositories.
     */
    private CampaignResponse buildResponse(Campaign c) {
        long total     = resumeRepository.countByCampaignId(c.getId());
        long completed = resumeRepository.countByCampaignIdAndStatus(c.getId(), ResumeStatus.COMPLETED);
        long pending   = resumeRepository.countByCampaignIdAndStatus(c.getId(), ResumeStatus.PENDING);
        long failed    = resumeRepository.countByCampaignIdAndStatus(c.getId(), ResumeStatus.FAILED);
        Double avgScore = resultRepository.avgScoreByCampaignId(c.getId());

        String topCandidate = resultRepository
                .findTop10ByCampaignIdOrderByOverallScoreDesc(c.getId())
                .stream()
                .findFirst()
                .map(r -> r.getResume() != null ? r.getResume().getCandidateName() : null)
                .orElse(null);

        return CampaignResponse.from(c, total, completed, pending, failed, avgScore, topCandidate);
    }

    private Campaign getCampaignOrThrow(String id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found: " + id));
    }
}
