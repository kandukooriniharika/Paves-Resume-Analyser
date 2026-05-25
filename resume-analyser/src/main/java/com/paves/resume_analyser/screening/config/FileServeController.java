package com.paves.resume_analyser.screening.config;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves files stored on the local filesystem by the {@code LocalStorageService}.
 * Only active when running in local-storage mode; in S3 mode files are served
 * directly from their public S3 URL.
 */
@RestController
@RequestMapping("/api/screening/files")
public class FileServeController {

    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> serveFile(@PathVariable String filename) throws IOException {
        Path path = Paths.get("./uploads/screening/", filename);
        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }
        byte[] bytes = Files.readAllBytes(path);
        String detected = Files.probeContentType(path);
        MediaType contentType = MediaType.parseMediaType(
                detected != null ? detected : "application/octet-stream");
        return ResponseEntity.ok()
                .contentType(contentType)
                .body(bytes);
    }
}
