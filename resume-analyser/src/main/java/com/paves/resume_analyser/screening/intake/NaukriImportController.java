package com.paves.resume_analyser.screening.intake;

import com.paves.resume_analyser.screening.common.ApiResponse;
import com.paves.resume_analyser.screening.talentpool.CandidateSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Imports candidates from a Naukri recruiter folder XLSX export.
 *
 * How to get the XLSX from Naukri:
 *  1. Login to Naukri Recruiter portal.
 *  2. Open your job folder → select candidates (max 500 at once).
 *  3. Click "Download" → choose Excel format.
 *  4. Upload the downloaded .xlsx here with the target campaignId.
 *
 * Expected XLSX columns (Naukri default export):
 *   Candidate Name | Email | Mobile | Current Designation | Resume Link | ...
 */
@Slf4j
@RestController
@RequestMapping("/api/intake/naukri")
@RequiredArgsConstructor
public class NaukriImportController {

    private final IntakeService intakeService;
    private final WebClient httpClient = WebClient.create();

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<NaukriImportResult>> importXlsx(
            @RequestParam String campaignId,
            @RequestPart("file") MultipartFile xlsxFile) throws Exception {

        List<String> processed = new ArrayList<>();
        List<String> failed    = new ArrayList<>();

        try (InputStream is = xlsxFile.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Map<String, Integer> colIndex = buildColumnIndex(sheet.getRow(0));

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String name      = cell(row, colIndex, "Candidate Name");
                String resumeUrl = cell(row, colIndex, "Resume Link");

                if (resumeUrl == null || resumeUrl.isBlank()) {
                    failed.add("Row " + (i + 1) + ": no resume link");
                    continue;
                }

                try {
                    byte[] resumeBytes = httpClient.get()
                            .uri(resumeUrl)
                            .retrieve()
                            .bodyToMono(byte[].class)
                            .block();

                    if (resumeBytes == null || resumeBytes.length == 0) {
                        failed.add(name + ": empty download");
                        continue;
                    }

                    intakeService.ingest(campaignId, resumeBytes,
                            sanitize(name) + ".pdf", "application/pdf", CandidateSource.NAUKRI);
                    processed.add(name);
                } catch (Exception e) {
                    log.warn("Naukri import failed for row {}: {}", i + 1, e.getMessage());
                    failed.add(name + ": " + e.getMessage());
                }
            }
        }

        log.info("Naukri import: campaign={} processed={} failed={}", campaignId, processed.size(), failed.size());
        return ResponseEntity.ok(ApiResponse.success(
                new NaukriImportResult(processed.size(), failed.size(), failed)));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Map<String, Integer> buildColumnIndex(Row header) {
        Map<String, Integer> idx = new java.util.HashMap<>();
        if (header == null) return idx;
        for (Cell cell : header) {
            String name = cell.getStringCellValue().trim();
            idx.put(name, cell.getColumnIndex());
        }
        return idx;
    }

    private String cell(Row row, Map<String, Integer> idx, String colName) {
        Integer col = idx.get(colName);
        if (col == null) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> null;
        };
    }

    private String sanitize(String name) {
        return name == null ? "candidate" : name.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    public record NaukriImportResult(int processed, int failed, List<String> errors) {}
}
