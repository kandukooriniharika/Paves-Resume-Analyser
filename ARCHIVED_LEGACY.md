# Archived Legacy Code Patterns

Removed in cleanup (2026-05-25) — kept here as reference.

---

## 1. Direct Java → Gemini API Call (`AIAnalysisService`)

Useful if you ever want Layer3 scoring done directly in Java without the Python AI service.
The Python service currently handles this, but this pattern shows how to call Gemini 1.5 Flash from Java.

```java
// application.properties:
// gemini.api.key=YOUR_KEY
// gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

@Value("${gemini.api.key}") private String geminiApiKey;
@Value("${gemini.api.url}") private String geminiApiUrl;
// WebClient bean (no base URL — full URL used per call)

public ResumeAnalysisDTO analyze(String resumeText, String jobTitle,
                                  String branchName, String requiredSkills) {
    String prompt = """
        Analyse the following resume for: %s | Branch: %s | Required Skills: %s
        Resume: ---\n%s\n---
        Return ONLY valid JSON:
        { "atsScore": 0-100, "skillMatchScore": 0-100, "overallScore": 0-100,
          "matchedSkills": "...", "missingSkills": "...",
          "strengths": "...", "suggestions": "...", "aiSummary": "..." }
        """.formatted(jobTitle, branchName, requiredSkills, resumeText);

    Map<String, Object> requestBody = Map.of(
        "contents", new Object[]{ Map.of("parts", new Object[]{ Map.of("text", prompt) }) },
        "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 1500)
    );

    String rawResponse = webClient.post()
            .uri(geminiApiUrl + "?key=" + geminiApiKey)
            .header("Content-Type", "application/json")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();

    // Parse: candidates[0] → content → parts[0] → text → strip ```json fences → readTree
    JsonNode root = objectMapper.readTree(rawResponse);
    String text = root.path("candidates").get(0)
            .path("content").path("parts").get(0).path("text").asText();
    text = text.replaceAll("```json", "").replaceAll("```", "").trim();
    JsonNode result = objectMapper.readTree(text);
    // map result fields to DTO
}
```

---

## 2. Cloudinary File Upload Pattern (`ResumeService`)

If switching from local/S3 storage back to Cloudinary for resume PDFs:

```java
// pom.xml: com.cloudinary:cloudinary-http5:2.2.0
// application.properties:
//   cloudinary.cloud-name=xxx
//   cloudinary.api-key=xxx
//   cloudinary.api-secret=xxx

@Bean
public Cloudinary cloudinary() {
    return new Cloudinary(Map.of(
        "cloud_name", cloudName,
        "api_key", apiKey,
        "api_secret", apiSecret,
        "secure", true
    ));
}

// Upload:
Map<String, Object> result = cloudinary.uploader().upload(
    file.getBytes(),
    Map.of(
        "folder", "paves/resumes/" + branchCode,
        "resource_type", "raw",
        "public_id", "resume_" + System.currentTimeMillis()
    )
);
String fileUrl  = (String) result.get("secure_url");   // CDN URL
String publicId = (String) result.get("public_id");    // for later deletion
```

---

## 3. Branch-Scoped Analytics (`BranchService.getBranchSummary`)

Per-branch stats aggregation — useful if re-adding a branch-level analytics view:

```java
// Returns: branchId, branchName, totalResumes, shortlisted, avgScore, openPositions
branchRepository.findAll().stream().map(branch -> {
    List<Double> scores = resumeRepository
            .findByBranchIdOrderByOverallScoreDesc(branch.getId())
            .stream()
            .map(r -> r.getOverallScore() != null ? r.getOverallScore().doubleValue() : 0.0)
            .collect(Collectors.toList());
    double avg = scores.isEmpty() ? 0.0
            : scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    return BranchSummaryDTO.builder()
            .branchId(branch.getId())
            .branchName(branch.getName())
            .totalResumes(resumeRepository.countByBranchId(branch.getId()))
            .shortlisted(resumeRepository.countByBranchIdAndIsShortlistedTrue(branch.getId()))
            .avgScore(avg)
            .openPositions(jobRoleRepository.countByBranchIdAndIsOpenTrue(branch.getId()))
            .build();
}).collect(Collectors.toList());
```

---

## 4. Old Resume Entity Schema (for reference)

The old `resumes` table had these columns in addition to the new `screening_resumes` table:
`candidate_name, candidate_email, candidate_phone, file_url, public_id (cloudinary), extracted_text,
ats_score, skill_match_score, overall_score, matched_skills, missing_skills, suggestions, strengths,
ai_summary, status (PENDING/ANALYSING/ANALYSED/SHORTLISTED/REJECTED), is_shortlisted,
shortlist_notes, shortlisted_at, branch_id (FK), job_role_id (FK), uploaded_by (FK), uploaded_at, analysed_at`

The new `ScreeningResult` in `screening_results` table replaces the AI score columns.
The new `ScreeningResume` in `screening_resumes` replaces the file + candidate info columns.
