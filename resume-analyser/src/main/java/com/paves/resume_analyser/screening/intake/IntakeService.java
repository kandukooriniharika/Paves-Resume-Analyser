package com.paves.resume_analyser.screening.intake;

import com.paves.resume_analyser.screening.campaign.Campaign;
import com.paves.resume_analyser.screening.campaign.CampaignRepository;
import com.paves.resume_analyser.screening.pipeline.PipelineService;
import com.paves.resume_analyser.screening.resume.ResumeStatus;
import com.paves.resume_analyser.screening.resume.ScreeningResume;
import com.paves.resume_analyser.screening.resume.ScreeningResumeRepository;
import com.paves.resume_analyser.screening.storage.StorageService;
import com.paves.resume_analyser.screening.talentpool.CandidateSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Common intake logic used by all inbound channels
 * (website direct-post, LinkedIn webhook, Naukri import).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntakeService {

    private final ScreeningResumeRepository resumeRepo;
    private final CampaignRepository campaignRepo;
    private final StorageService storageService;
    private final PipelineService pipelineService;

    /**
     * Stores a resume file and immediately triggers the screening pipeline.
     *
     * @param campaignId   target campaign
     * @param fileBytes    raw resume bytes
     * @param filename     original filename
     * @param contentType  MIME type
     * @param source       intake channel for talent-pool tracking
     * @return the saved ScreeningResume entity
     */
    @Transactional
    public ScreeningResume ingest(String campaignId, byte[] fileBytes,
                                   String filename, String contentType,
                                   CandidateSource source) {
        Campaign campaign = campaignRepo.findById(campaignId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Campaign not found: " + campaignId));

        String fileUrl = storageService.upload(fileBytes, filename, contentType);

        ScreeningResume resume = ScreeningResume.builder()
                .campaign(campaign)
                .originalFilename(filename)
                .fileUrl(fileUrl)
                .contentType(contentType)
                .status(ResumeStatus.PENDING)
                .build();
        resumeRepo.save(resume);

        pipelineService.runPipeline(campaignId);
        log.info("Ingested resume via {}: campaign={} file={}", source, campaignId, filename);
        return resume;
    }
}
