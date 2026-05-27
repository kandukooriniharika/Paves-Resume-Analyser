package com.paves.resume_analyser.screening.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Cloudinary-backed file storage.
 * Activated by setting {@code storage.type=cloudinary}.
 * Resumes are uploaded as raw files under the "paves-resumes" folder.
 */
@Slf4j
@Service
@Primary
@ConditionalOnProperty(name = "storage.type", havingValue = "cloudinary")
public class CloudinaryStorageService implements StorageService {

    private final Cloudinary cloudinary;

    public CloudinaryStorageService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));
    }

    @Override
    public String upload(byte[] data, String filename, String contentType) {
        try {
            String publicId = "paves-resumes/" + UUID.randomUUID() + "-" + sanitize(filename);
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(data, ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", "raw",
                    "use_filename", false,
                    "unique_filename", false));
            String url = (String) result.get("secure_url");
            log.debug("Cloudinary upload: {} → {}", filename, url);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Cloudinary upload failed for " + filename, e);
        }
    }

    @Override
    public String getKey(String filename) {
        return "paves-resumes/" + filename;
    }

    @Override
    public void delete(String key) {
        try {
            cloudinary.uploader().destroy(key, ObjectUtils.asMap("resource_type", "raw"));
            log.debug("Cloudinary deleted: {}", key);
        } catch (IOException e) {
            log.warn("Cloudinary delete failed for {}: {}", key, e.getMessage());
        }
    }

    private String sanitize(String filename) {
        return filename == null ? "file" : filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
