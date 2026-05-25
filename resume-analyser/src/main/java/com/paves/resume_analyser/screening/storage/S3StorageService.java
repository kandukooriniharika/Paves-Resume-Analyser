package com.paves.resume_analyser.screening.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

/**
 * Stores files in AWS S3. Active when {@code storage.type=s3}.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;

    public S3StorageService(S3Client s3Client,
                            @Value("${aws.s3.bucket}") String bucket,
                            @Value("${aws.s3.region}") String region) {
        this.s3Client = s3Client;
        this.bucket = bucket;
        this.region = region;
    }

    @Override
    public String upload(byte[] data, String filename, String contentType) {
        String key = "screening/" + UUID.randomUUID() + "-" + filename;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(data));
        log.debug("Uploaded {} to S3 bucket {} key {}", filename, bucket, key);

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    @Override
    public String getKey(String filename) {
        // The real key is UUID-prefixed; callers that need deletion should use the key
        // embedded in the URL returned by upload(). This returns a best-effort value.
        return "screening/" + filename;
    }

    @Override
    public void delete(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            log.debug("Deleted S3 object {}", key);
        } catch (Exception e) {
            log.warn("Could not delete S3 object {}: {}", key, e.getMessage());
        }
    }
}
