package com.paves.resume_analyser.screening.resume;

import com.paves.resume_analyser.screening.campaign.Campaign;
import com.paves.resume_analyser.screening.campaign.CampaignRepository;
import com.paves.resume_analyser.screening.resume.dto.ResumeResponse;
import com.paves.resume_analyser.screening.resume.dto.UploadStatusResponse;
import com.paves.resume_analyser.screening.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeUploadService {

    private final ScreeningResumeRepository resumeRepository;
    private final CampaignRepository campaignRepository;
    private final StorageService storageService;

    private static final Set<String> ALLOWED_TYPES = Set.of(".pdf", ".docx", ".doc", ".txt");
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024L; // 50 MB

    /**
     * Handles bulk upload: accepts regular files and ZIP archives in one call.
     * ZIP files are transparently extracted and each contained resume is processed.
     *
     * @return list of saved resume DTOs (skipped/invalid files are silently omitted)
     */
    @Transactional
    public List<ResumeResponse> bulkUpload(String campaignId, List<MultipartFile> files) throws Exception {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found: " + campaignId));

        List<ResumeResponse> results = new ArrayList<>();
        for (MultipartFile file : files) {
            String filename = file.getOriginalFilename();
            if (filename != null && filename.toLowerCase().endsWith(".zip")) {
                results.addAll(processZip(campaign, file.getBytes()));
            } else {
                ResumeResponse r = processSingleFile(
                        campaign, file.getBytes(), filename, file.getContentType());
                if (r != null) results.add(r);
            }
        }
        log.info("Bulk upload campaign={}: {} files accepted", campaignId, results.size());
        return results;
    }

    /** Extracts a ZIP archive and processes each valid resume file inside. */
    private List<ResumeResponse> processZip(Campaign campaign, byte[] zipBytes) throws IOException {
        List<ResumeResponse> results = new ArrayList<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) continue;
                // Grab just the filename, ignoring any directory path inside the ZIP
                String name = Path.of(entry.getName()).getFileName().toString();
                if (!isAllowedFile(name)) continue;
                byte[] bytes = zis.readAllBytes();
                ResumeResponse r = processSingleFile(campaign, bytes, name, null);
                if (r != null) results.add(r);
                zis.closeEntry();
            }
        }
        return results;
    }

    /** Validates, stores, and persists a single resume file. Returns null if validation fails. */
    private ResumeResponse processSingleFile(Campaign campaign,
                                              byte[] bytes,
                                              String filename,
                                              String contentType) {
        if (!isAllowedFile(filename)) {
            log.debug("Skipped unsupported file: {}", filename);
            return null;
        }
        if (bytes.length > MAX_FILE_SIZE) {
            log.warn("Skipped oversized file: {} ({} bytes)", filename, bytes.length);
            return null;
        }

        String fileUrl = storageService.upload(bytes, filename, contentType);
        // Extract the stored filename from the returned URL for the s3Key field
        String s3Key = fileUrl.contains("/") ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : fileUrl;

        ScreeningResume resume = ScreeningResume.builder()
                .campaign(campaign)
                .originalFilename(filename)
                .fileUrl(fileUrl)
                .s3Key(s3Key)
                .contentType(contentType)
                .status(ResumeStatus.PENDING)
                .build();

        return ResumeResponse.from(resumeRepository.save(resume));
    }

    private boolean isAllowedFile(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase();
        return ALLOWED_TYPES.stream().anyMatch(lower::endsWith);
    }

    /** Returns all resumes for a campaign ordered newest-first. */
    public List<ResumeResponse> listResumes(String campaignId) {
        return resumeRepository.findByCampaignIdOrderByUploadedAtDesc(campaignId)
                .stream()
                .map(ResumeResponse::from)
                .toList();
    }

    /** Returns per-status counts and a computed progress percentage for the campaign. */
    public UploadStatusResponse getUploadStatus(String campaignId) {
        long total       = resumeRepository.countByCampaignId(campaignId);
        long parsing     = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.PARSING);
        long layer1      = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.LAYER1);
        long layer2      = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.LAYER2);
        long aiScoring   = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.AI_SCORING);
        long completed   = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.COMPLETED);
        long failed      = resumeRepository.countByCampaignIdAndStatus(campaignId, ResumeStatus.FAILED);
        long fraudged    = resumeRepository.countByCampaignIdAndFraudFlagged(campaignId, true);

        return UploadStatusResponse.builder()
                .campaignId(campaignId)
                .total(total)
                .parsing(parsing)
                .layer1(layer1)
                .layer2(layer2)
                .aiScoring(aiScoring)
                .completed(completed)
                .failed(failed)
                .fraudFlagged(fraudged)
                .build();
    }

    @Transactional
    public void deleteResume(String resumeId) {
        ScreeningResume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found: " + resumeId));
        if (resume.getS3Key() != null) {
            storageService.delete(resume.getS3Key());
        }
        resumeRepository.delete(resume);
        log.info("Deleted resume id={}", resumeId);
    }
}
