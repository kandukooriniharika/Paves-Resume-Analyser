package com.paves.resume_analyser.screening.storage;

/**
 * Abstraction over file storage back-ends (local disk or AWS S3).
 * Implementations are selected via the {@code storage.type} property.
 */
public interface StorageService {

    /**
     * Persists the given bytes and returns the public URL at which the file can be accessed.
     *
     * @param data        raw file bytes
     * @param filename    original filename (used to derive the stored name / key)
     * @param contentType MIME type; may be null
     * @return public URL string
     */
    String upload(byte[] data, String filename, String contentType);

    /**
     * Returns the storage key (S3 object key or local relative path) for a given filename.
     * The key is what you pass to {@link #delete(String)}.
     */
    String getKey(String filename);

    /**
     * Deletes the stored file identified by {@code key}.
     *
     * @param key storage key returned by {@link #getKey(String)}
     */
    void delete(String key);
}
