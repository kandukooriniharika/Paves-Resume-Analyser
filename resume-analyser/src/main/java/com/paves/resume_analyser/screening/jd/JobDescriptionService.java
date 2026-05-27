package com.paves.resume_analyser.screening.jd;

import com.paves.resume_analyser.screening.ai.AIScreeningClient;
import com.paves.resume_analyser.screening.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobDescriptionService {

    private final JobDescriptionRepository jdRepo;
    private final StorageService storageService;
    private final AIScreeningClient aiClient;

    /** Create a JD from pasted text. */
    @Transactional
    public JobDescription createFromText(String title, String department,
                                         String rawText, String scoringWeights,
                                         String createdBy) {
        Map<String, Object> parsed = parseWithAI(rawText);
        JobDescription jd = JobDescription.builder()
                .title(title)
                .department(department)
                .rawText(rawText)
                .fileType("text")
                .requiredSkills((String) parsed.getOrDefault("required_skills", ""))
                .niceToHaveSkills((String) parsed.getOrDefault("nice_to_have", ""))
                .minExperience(toInt(parsed.getOrDefault("min_experience", 0)))
                .maxExperience(toInt(parsed.getOrDefault("max_experience", 0)))
                .scoringWeightsJson(scoringWeights)
                .status(JdStatus.DRAFT)
                .createdBy(createdBy)
                .build();
        return jdRepo.save(jd);
    }

    /** Create a JD from an uploaded PDF or DOCX file. */
    @Transactional
    public JobDescription createFromFile(String title, String department,
                                          MultipartFile file, String scoringWeights,
                                          String createdBy) throws Exception {
        byte[] bytes = file.getBytes();
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "jd";
        String rawText = extractText(bytes, filename);
        String fileUrl = storageService.upload(bytes, filename, file.getContentType());

        Map<String, Object> parsed = parseWithAI(rawText);
        JobDescription jd = JobDescription.builder()
                .title(title)
                .department(department)
                .rawText(rawText)
                .fileUrl(fileUrl)
                .fileType(extension(filename))
                .requiredSkills((String) parsed.getOrDefault("required_skills", ""))
                .niceToHaveSkills((String) parsed.getOrDefault("nice_to_have", ""))
                .minExperience(toInt(parsed.getOrDefault("min_experience", 0)))
                .maxExperience(toInt(parsed.getOrDefault("max_experience", 0)))
                .scoringWeightsJson(scoringWeights)
                .status(JdStatus.DRAFT)
                .createdBy(createdBy)
                .build();
        return jdRepo.save(jd);
    }

    /** Edit an existing JD — creates a new version linked to the original. */
    @Transactional
    public JobDescription createNewVersion(String jdId, String newTitle, String newText,
                                            String scoringWeights, String createdBy) {
        JobDescription original = jdRepo.findById(jdId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "JD not found: " + jdId));

        String parentId = original.getParentId() != null ? original.getParentId() : original.getId();
        int nextVersion = jdRepo.findByParentIdOrderByVersionDesc(parentId).stream()
                .mapToInt(JobDescription::getVersion).max().orElse(original.getVersion()) + 1;

        Map<String, Object> parsed = parseWithAI(newText);
        JobDescription updated = JobDescription.builder()
                .parentId(parentId)
                .version(nextVersion)
                .title(newTitle != null ? newTitle : original.getTitle())
                .department(original.getDepartment())
                .rawText(newText)
                .fileType("text")
                .requiredSkills((String) parsed.getOrDefault("required_skills", ""))
                .niceToHaveSkills((String) parsed.getOrDefault("nice_to_have", ""))
                .minExperience(toInt(parsed.getOrDefault("min_experience", 0)))
                .maxExperience(toInt(parsed.getOrDefault("max_experience", 0)))
                .scoringWeightsJson(scoringWeights != null ? scoringWeights : original.getScoringWeightsJson())
                .status(JdStatus.DRAFT)
                .createdBy(createdBy)
                .build();
        return jdRepo.save(updated);
    }

    public List<JobDescription> listAll() { return jdRepo.findAllByOrderByCreatedAtDesc(); }

    public List<JobDescription> listActive() { return jdRepo.findByStatusOrderByCreatedAtDesc(JdStatus.ACTIVE); }

    public JobDescription getById(String id) {
        return jdRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "JD not found: " + id));
    }

    @Transactional
    public JobDescription activate(String id) {
        JobDescription jd = getById(id);
        jd.setStatus(JdStatus.ACTIVE);
        return jdRepo.save(jd);
    }

    @Transactional
    public JobDescription archive(String id) {
        JobDescription jd = getById(id);
        jd.setStatus(JdStatus.ARCHIVED);
        return jdRepo.save(jd);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> parseWithAI(String text) {
        try {
            if (aiClient.isHealthy()) {
                return aiClient.parseJd(text);
            }
        } catch (Exception e) {
            log.warn("AI JD parse failed, proceeding without AI extraction: {}", e.getMessage());
        }
        return Map.of();
    }

    private String extractText(byte[] bytes, String filename) throws Exception {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            try (PDDocument doc = PDDocument.load(new ByteArrayInputStream(bytes))) {
                return new PDFTextStripper().getText(doc);
            }
        }
        if (lower.endsWith(".docx")) {
            try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes))) {
                StringBuilder sb = new StringBuilder();
                doc.getParagraphs().forEach(p -> sb.append(p.getText()).append("\n"));
                return sb.toString();
            }
        }
        return new String(bytes);
    }

    private String extension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase() : "txt";
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return 0; }
    }
}
