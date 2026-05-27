package com.paves.resume_analyser.screening.result;

import com.paves.resume_analyser.screening.campaign.Campaign;
import com.paves.resume_analyser.screening.resume.ScreeningResume;
import com.paves.resume_analyser.screening.workflow.CandidateStage;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stores all scoring layers and HR override data for a single screened resume.
 */
@Entity
@Table(name = "screening_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningResult {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", unique = true)
    private ScreeningResume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    /** Layer 1: keyword match score (0–100). */
    private Double layer1Score;

    /** Layer 2: semantic / embedding similarity score (0–100). */
    private Double layer2Score;

    /** Layer 3: Gemini AI holistic score (0–100). */
    private Double layer3Score;

    /** Weighted composite: 20% L1 + 30% L2 + 50% L3. */
    private Double atsScore;

    /** Final score — initially equals atsScore, may be updated by HR override. */
    private Double overallScore;

    @Enumerated(EnumType.STRING)
    private Recommendation recommendation;

    @Column(columnDefinition = "TEXT")
    private String matchedSkills;

    @Column(columnDefinition = "TEXT")
    private String missingSkills;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    private Integer experienceYears;
    private String educationLevel;
    private String seniority;

    /** JSON or human-readable description of fraud signals detected. */
    @Column(columnDefinition = "TEXT")
    private String fraudDetails;

    // ── HR Override fields ──────────────────────────────────────────────────

    /** Recruiter-managed pipeline stage (UPLOADED → SCREENING → SHORTLISTED → HM_REVIEW → INTERVIEW → SELECTED/REJECTED). */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CandidateStage candidateStage = CandidateStage.UPLOADED;

    private String stageChangedBy;
    private java.time.LocalDateTime stageChangedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private Double hrOverrideScore;

    @Column(columnDefinition = "TEXT")
    private String hrNotes;

    /** "SHORTLISTED" or "REJECTED". */
    private String hrStatus;

    private String hrOverrideBy;
    private LocalDateTime hrOverrideAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void ensureId() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }
}
