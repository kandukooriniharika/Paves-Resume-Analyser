package com.paves.resume_analyser.screening.result;

import com.paves.resume_analyser.screening.campaign.Campaign;
import com.paves.resume_analyser.screening.resume.ScreeningResume;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
}
