package com.paves.resume_analyser.screening.resume;

import com.paves.resume_analyser.screening.campaign.Campaign;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a single uploaded resume within a campaign.
 */
@Entity
@Table(name = "screening_resumes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    private String originalFilename;

    /** Public URL to access the file (S3 signed URL or local API path). */
    private String fileUrl;

    /** S3 object key or local relative path used for deletion/re-download. */
    private String s3Key;

    private String contentType;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResumeStatus status = ResumeStatus.PENDING;

    @Builder.Default
    private boolean ocrUsed = false;

    @Builder.Default
    private boolean fraudFlagged = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    /** Set when parsing (text extraction) completes. */
    private LocalDateTime parsedAt;
}
