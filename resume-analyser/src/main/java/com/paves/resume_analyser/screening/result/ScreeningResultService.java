package com.paves.resume_analyser.screening.result;

import com.paves.resume_analyser.screening.result.dto.CandidateRankResponse;
import com.paves.resume_analyser.screening.result.dto.HROverrideRequest;
import com.paves.resume_analyser.screening.result.dto.ScreeningResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScreeningResultService {

    private final ScreeningResultRepository resultRepository;

    public Page<ScreeningResultResponse> getResults(String campaignId, int page, int size) {
        return resultRepository
                .findByCampaignIdOrderByOverallScoreDesc(campaignId, PageRequest.of(page, size))
                .map(ScreeningResultResponse::from);
    }

    /** Returns the top-10 candidates for a campaign as a ranked list. */
    public List<CandidateRankResponse> getTopCandidates(String campaignId) {
        List<ScreeningResult> top = resultRepository
                .findTop10ByCampaignIdOrderByOverallScoreDesc(campaignId);
        AtomicInteger rank = new AtomicInteger(1);
        return top.stream()
                .map(r -> toRank(r, rank.getAndIncrement()))
                .collect(Collectors.toList());
    }

    public ScreeningResultResponse getResultDetail(String resultId) {
        ScreeningResult result = getResultOrThrow(resultId);
        return ScreeningResultResponse.from(result);
    }

    @Transactional
    public ScreeningResultResponse hrOverride(String resultId, HROverrideRequest req, String overrideBy) {
        ScreeningResult result = getResultOrThrow(resultId);

        result.setHrOverrideScore(req.getHrOverrideScore());
        result.setHrNotes(req.getHrNotes());
        result.setHrStatus(req.getHrStatus());
        result.setHrOverrideBy(overrideBy);
        result.setHrOverrideAt(LocalDateTime.now());

        // If a numeric override score is given, update overallScore to reflect HR judgement
        if (req.getHrOverrideScore() != null) {
            result.setOverallScore(req.getHrOverrideScore());
        }

        log.info("HR override result id={} status={} by {}", resultId, req.getHrStatus(), overrideBy);
        return ScreeningResultResponse.from(resultRepository.save(result));
    }

    @Transactional
    public ScreeningResultResponse shortlist(String resultId, String by) {
        ScreeningResult result = getResultOrThrow(resultId);
        result.setHrStatus("SHORTLISTED");
        result.setHrOverrideBy(by);
        result.setHrOverrideAt(LocalDateTime.now());
        log.info("Shortlisted result id={} by {}", resultId, by);
        return ScreeningResultResponse.from(resultRepository.save(result));
    }

    @Transactional
    public ScreeningResultResponse reject(String resultId, String by) {
        ScreeningResult result = getResultOrThrow(resultId);
        result.setHrStatus("REJECTED");
        result.setHrOverrideBy(by);
        result.setHrOverrideAt(LocalDateTime.now());
        log.info("Rejected result id={} by {}", resultId, by);
        return ScreeningResultResponse.from(resultRepository.save(result));
    }

    /**
     * Exports all results for a campaign as CSV or XLSX bytes.
     *
     * @param format "csv" or "xlsx" (case-insensitive)
     */
    public byte[] export(String campaignId, String format) throws Exception {
        List<ScreeningResult> results = resultRepository
                .findByCampaignIdOrderByOverallScoreDesc(campaignId);

        if ("xlsx".equalsIgnoreCase(format)) {
            return exportXlsx(results);
        }
        return exportCsv(results);
    }

    // ── Export helpers ────────────────────────────────────────────────────────

    private byte[] exportCsv(List<ScreeningResult> results) {
        StringBuilder sb = new StringBuilder();
        sb.append("Rank,Name,Email,Score,ATS Score,Recommendation,Matched Skills,Missing Skills,AI Feedback\n");
        int rank = 1;
        for (ScreeningResult r : results) {
            sb.append(rank++).append(',')
              .append(csv(candidateName(r))).append(',')
              .append(csv(candidateEmail(r))).append(',')
              .append(r.getOverallScore()).append(',')
              .append(r.getAtsScore()).append(',')
              .append(r.getRecommendation() != null ? r.getRecommendation().name() : "").append(',')
              .append(csv(r.getMatchedSkills())).append(',')
              .append(csv(r.getMissingSkills())).append(',')
              .append(csv(r.getAiFeedback()))
              .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] exportXlsx(List<ScreeningResult> results) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Screening Results");

            // Header row
            Row header = sheet.createRow(0);
            String[] headers = {"Rank", "Name", "Email", "Score", "ATS Score",
                    "Recommendation", "Matched Skills", "Missing Skills", "AI Feedback"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }

            // Data rows
            int rowNum = 1;
            int rank = 1;
            for (ScreeningResult r : results) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rank++);
                row.createCell(1).setCellValue(nullStr(candidateName(r)));
                row.createCell(2).setCellValue(nullStr(candidateEmail(r)));
                row.createCell(3).setCellValue(r.getOverallScore() != null ? r.getOverallScore() : 0);
                row.createCell(4).setCellValue(r.getAtsScore() != null ? r.getAtsScore() : 0);
                row.createCell(5).setCellValue(r.getRecommendation() != null ? r.getRecommendation().name() : "");
                row.createCell(6).setCellValue(nullStr(r.getMatchedSkills()));
                row.createCell(7).setCellValue(nullStr(r.getMissingSkills()));
                row.createCell(8).setCellValue(nullStr(r.getAiFeedback()));
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ── Rank DTO builder ──────────────────────────────────────────────────────

    private CandidateRankResponse toRank(ScreeningResult r, int rank) {
        List<String> matchedList = splitCsv(r.getMatchedSkills());
        return CandidateRankResponse.builder()
                .rank(rank)
                .resultId(r.getId())
                .resumeId(r.getResume() != null ? r.getResume().getId() : null)
                .campaignId(r.getCampaign() != null ? r.getCampaign().getId() : null)
                .roleName(r.getCampaign() != null ? r.getCampaign().getRoleName() : null)
                .candidateName(candidateName(r))
                .candidateEmail(candidateEmail(r))
                .overallScore(r.getOverallScore())
                .atsScore(r.getAtsScore())
                .recommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null)
                .hrStatus(r.getHrStatus())
                .matchedSkillList(matchedList)
                .build();
    }

    // ── Tiny utilities ────────────────────────────────────────────────────────

    private String candidateName(ScreeningResult r) {
        return r.getResume() != null ? r.getResume().getCandidateName() : null;
    }

    private String candidateEmail(ScreeningResult r) {
        return r.getResume() != null ? r.getResume().getCandidateEmail() : null;
    }

    private List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Escapes a value for CSV embedding (wraps in quotes, doubles internal quotes). */
    private String csv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }

    private String nullStr(String val) { return val != null ? val : ""; }

    private ScreeningResult getResultOrThrow(String resultId) {
        return resultRepository.findById(resultId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Result not found: " + resultId));
    }
}
