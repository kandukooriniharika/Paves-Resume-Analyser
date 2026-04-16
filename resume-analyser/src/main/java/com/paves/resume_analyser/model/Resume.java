package com.paves.resume_analyser.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"branch", "jobRole", "uploadedBy"})
@ToString(exclude = {"branch", "jobRole", "uploadedBy"})
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Candidate Info ──────────────────────────────────────────────────────
    @Column(nullable = false)
    private String candidateName;

    private String candidateEmail;
    private String candidatePhone;

    // ── File Storage ────────────────────────────────────────────────────────
    @Column(nullable = false)
    private String fileUrl;

    private String publicId;

    // ── Extracted Text ──────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String extractedText;

    // ── AI Scores ───────────────────────────────────────────────────────────
    private Integer atsScore;
    private Integer skillMatchScore;
    private Integer overallScore;

    // ── AI Analysis Fields ──────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String matchedSkills;

    @Column(columnDefinition = "TEXT")
    private String missingSkills;

    @Column(columnDefinition = "TEXT")
    private String suggestions;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    // ── Status ──────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    private ResumeStatus status;

    // FIX: PostgreSQL reserves "is_shortlisted" column name collision with Lombok getter.
    // Explicit @Column name avoids any naming ambiguity.
    @Builder.Default
    @Column(name = "is_shortlisted")
    private boolean isShortlisted = false;

    private String shortlistNotes;
    private LocalDateTime shortlistedAt;

    // ── Relationships ────────────────────────────────────────────────────────
    // FIX: reference names match Branch/JobRole @JsonManagedReference names
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    @JsonBackReference("branch-resume")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_role_id")
    @JsonBackReference("jobrole-resume")
    private JobRole jobRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    // ── Timestamps ───────────────────────────────────────────────────────────
    private LocalDateTime uploadedAt;
    private LocalDateTime analysedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (status == null) status = ResumeStatus.PENDING;
    }

    // ── Status Enum ──────────────────────────────────────────────────────────
    public enum ResumeStatus {
        PENDING,
        ANALYSING,
        ANALYSED,
        SHORTLISTED,
        REJECTED
    }
}
