package com.paves.resume_analyser.screening.talentpool;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Reusable candidate record stored beyond any single campaign.
 * Candidates are never permanently deleted — rejected ones may be re-matched in future.
 */
@Entity
@Table(name = "talent_pool",
        uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TalentPool {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    private String phone;

    /** Comma-separated normalised skills. */
    @Column(columnDefinition = "TEXT")
    private String skills;

    private Integer experienceYears;
    private String educationLevel;
    private String seniority;
    private String currentLocation;

    /** Latest resume file URL (Cloudinary / local). */
    private String latestResumeUrl;

    /** The campaign this candidate was originally screened for. */
    private String sourceCampaignId;

    /** Source channel: WEBSITE, LINKEDIN, NAUKRI, MANUAL. */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CandidateSource source = CandidateSource.MANUAL;

    /** Overall score from the last AI screening (0–100). */
    private Double lastScore;

    /** How many times this candidate has been screened. */
    @Builder.Default
    private int screeningCount = 1;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime firstSeenAt;

    @UpdateTimestamp
    private LocalDateTime lastUpdatedAt;

    /** Date of last AI screening run. */
    private LocalDateTime lastScreenedAt;

    @PrePersist
    void ensureId() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
    }
}
