package com.paves.resume_analyser.service;

import com.cloudinary.Cloudinary;
import com.paves.resume_analyser.dto.ResumeAnalysisDTO;
import com.paves.resume_analyser.model.*;
import com.paves.resume_analyser.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final BranchRepository branchRepository;
    private final JobRoleRepository jobRoleRepository;
    private final PDFExtractService pdfExtractService;
    private final AIAnalysisService aiAnalysisService;
    private final Cloudinary cloudinary;

    /**
     * Full pipeline: upload PDF → extract text → AI analysis → save to DB.
     */
    @SuppressWarnings("unchecked")
    public Resume uploadAndAnalyse(MultipartFile file, String candidateName,
                                   String candidateEmail, Long branchId, Long jobRoleId) {

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        JobRole jobRole = jobRoleRepository.findById(jobRoleId)
                .orElseThrow(() -> new RuntimeException("Job role not found"));

        try {
            // 1. Upload PDF to Cloudinary
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of(
                        "folder", "paves/resumes/" + branch.getCode(),
                        "resource_type", "raw",
                        "public_id", "resume_" + System.currentTimeMillis()
                    )
            );
            String fileUrl  = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            // 2. Extract text from PDF
            String extractedText = pdfExtractService.extractText(file.getBytes());

            // 3. AI Analysis with Paves-specific context
            ResumeAnalysisDTO analysis = aiAnalysisService.analyze(
                    extractedText,
                    jobRole.getTitle(),
                    branch.getName(),
                    jobRole.getRequiredSkills() != null ? jobRole.getRequiredSkills() : ""
            );

            // 4. Build and save Resume entity
            Resume resume = Resume.builder()
                    .candidateName(candidateName)
                    .candidateEmail(candidateEmail)
                    .fileUrl(fileUrl)
                    .publicId(publicId)
                    .extractedText(extractedText)
                    .branch(branch)
                    .jobRole(jobRole)
                    .status(Resume.ResumeStatus.ANALYSED)
                    .atsScore(analysis.getAtsScore())
                    .skillMatchScore(analysis.getSkillMatchScore())
                    .overallScore(analysis.getOverallScore())
                    .matchedSkills(analysis.getMatchedSkills())
                    .missingSkills(analysis.getMissingSkills())
                    .strengths(analysis.getStrengths())
                    .suggestions(analysis.getSuggestions())
                    .aiSummary(analysis.getAiSummary())
                    .build();

            return resumeRepository.save(resume);

        } catch (Exception e) {
            log.error("Resume upload/analysis failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process resume: " + e.getMessage());
        }
    }

    /**
     * Simple stub-compatible create (used by old ResumeController test endpoint).
     */
    public Resume createResume(String name, Long branchId, Long jobId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        JobRole job = jobRoleRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job role not found"));

        Resume resume = Resume.builder()
                .candidateName(name)
                .fileUrl("pending-upload")
                .branch(branch)
                .jobRole(job)
                .status(Resume.ResumeStatus.PENDING)
                .build();

        return resumeRepository.save(resume);
    }

    public List<Resume> getByBranch(Long branchId) {
        return resumeRepository.findByBranchIdOrderByUploadedAtDesc(branchId);
    }

    public List<Resume> getTopResumes(Long branchId) {
        // FIX: use corrected method name findTop10ByBranchIdOrderByOverallScoreDesc
        return resumeRepository.findTop10ByBranchIdOrderByOverallScoreDesc(branchId);
    }

    public Resume shortlist(Long resumeId, String notes) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        resume.setShortlisted(true);
        resume.setShortlistNotes(notes);
        resume.setStatus(Resume.ResumeStatus.SHORTLISTED);
        return resumeRepository.save(resume);
    }
}