package com.paves.resume_analyser.screening.jd;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Standalone JD entity — uploaded by HR_ADMIN as PDF/DOCX or pasted text.
 * Versioned: each edit creates a new row; {@code parentId} links versions.
 */
@Entity
@Table(name = "job_descriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDescription {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    /** Null for the first version; set to the original JD id for subsequent versions. */
    private String parentId;

    private int version;

    @Column(nullable = false)
    private String title;

    private String department;

    @Column(columnDefinition = "TEXT")
    private String rawText;

    /** URL (Cloudinary / local) of the uploaded JD file, if any. */
    private String fileUrl;

    private String fileType;   // pdf, docx, txt

    /** Comma-separated required skills extracted from JD. */
    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    /** Comma-separated nice-to-have skills extracted from JD. */
    @Column(columnDefinition = "TEXT")
    private String niceToHaveSkills;

    private Integer minExperience;
    private Integer maxExperience;

    /** JSON: {"skills":40,"experience":30,"education":15,"ai":15} */
    @Column(columnDefinition = "TEXT")
    private String scoringWeightsJson;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private JdStatus status = JdStatus.DRAFT;

    private String createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @PrePersist
    void ensureId() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
        if (version == 0) version = 1;
    }
}
