package com.paves.resume_analyser.screening.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Stores files on the local filesystem under {@code ./uploads/screening/}.
 * Active when {@code storage.type=local} (the default when the property is absent).
 */
@Slf4j
@Service
@Primary
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final String BASE_DIR = "./uploads/screening/";
    private static final String URL_PREFIX = "/api/screening/files/";

    @Override
    public String upload(byte[] data, String filename, String contentType) {
        try {
            Path dir = Paths.get(BASE_DIR);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
            String storedName = UUID.randomUUID() + "-" + filename;
            Path target = dir.resolve(storedName);
            Files.write(target, data);
            log.debug("Stored file {} ({} bytes)", storedName, data.length);
            return URL_PREFIX + storedName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + filename, e);
        }
    }

    /**
     * Derives the storage key (UUID-prefixed filename) from the original filename.
     * In practice the caller should capture the value returned by {@link #upload} and
     * strip the URL prefix, but this method provides a consistent accessor.
     */
    @Override
    public String getKey(String filename) {
        // The actual key is the UUID-prefixed name written during upload.
        // Since we cannot recover that UUID here, we return the raw filename as a no-op key.
        // The full key is embedded in the URL returned by upload(); callers that need
        // accurate deletion should extract the filename segment from that URL instead.
        return filename;
    }

    @Override
    public void delete(String key) {
        try {
            Path target = Paths.get(BASE_DIR, key);
            if (Files.exists(target)) {
                Files.delete(target);
                log.debug("Deleted file {}", key);
            }
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", key, e.getMessage());
        }
    }
}
