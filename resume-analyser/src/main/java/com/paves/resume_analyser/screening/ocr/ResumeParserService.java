package com.paves.resume_analyser.screening.ocr;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Extracts plain text from uploaded resume files.
 * Supports PDF (with OCR fallback), DOCX, DOC, and plain text.
 */
@Slf4j
@Service
public class ResumeParserService {

    private final WebClient webClient;

    public ResumeParserService(
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl) {
        this.webClient = WebClient.builder().baseUrl(aiServiceUrl).build();
    }

    /**
     * Main entry point: detects file type from the extension and extracts text.
     *
     * @param fileBytes raw bytes of the uploaded file
     * @param filename  original filename (used for type detection)
     * @return extracted plain text; never null, may be empty
     */
    public String extractText(byte[] fileBytes, String filename) throws Exception {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf"))  return extractFromPdf(fileBytes, filename);
        if (lower.endsWith(".docx")) return extractFromDocx(fileBytes);
        if (lower.endsWith(".doc"))  return extractFromDoc(fileBytes);
        if (lower.endsWith(".txt"))  return new String(fileBytes, StandardCharsets.UTF_8);
        throw new IllegalArgumentException("Unsupported file type: " + filename);
    }

    /**
     * Extracts text from a PDF with PDFBox.
     * Falls back to the AI-service OCR endpoint when the extracted text is
     * shorter than 100 characters (scanned / image-only PDF).
     */
    private String extractFromPdf(byte[] bytes, String filename) throws Exception {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            if (text != null && text.trim().length() >= 100) {
                return text;
            }
            log.info("PDF '{}' yielded < 100 chars — falling back to OCR", filename);
            return callAiOcr(bytes, filename);
        }
    }

    /** Extracts text from a DOCX file using Apache POI XWPFDocument. */
    private String extractFromDocx(byte[] bytes) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(bytes));
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    /** Extracts text from a legacy DOC file using Apache POI HWPFDocument. */
    private String extractFromDoc(byte[] bytes) throws Exception {
        try (HWPFDocument doc = new HWPFDocument(new ByteArrayInputStream(bytes));
             WordExtractor extractor = new WordExtractor(doc)) {
            return extractor.getText();
        }
    }

    /**
     * Calls the AI service OCR endpoint when local extraction is insufficient.
     * Sends the file as a base64 string and reads back the {@code extracted_text} field.
     */
    @SuppressWarnings("unchecked")
    private String callAiOcr(byte[] bytes, String filename) {
        try {
            String base64 = Base64.getEncoder().encodeToString(bytes);
            Map<String, Object> body = Map.of(
                    "file_base64", base64,
                    "filename", filename
            );
            Map<String, Object> response = webClient.post()
                    .uri("/ai/parse-resume")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (response != null && response.containsKey("extracted_text")) {
                return (String) response.get("extracted_text");
            }
            return "";
        } catch (Exception e) {
            log.warn("AI OCR call failed for '{}': {}", filename, e.getMessage());
            return "";
        }
    }
}
