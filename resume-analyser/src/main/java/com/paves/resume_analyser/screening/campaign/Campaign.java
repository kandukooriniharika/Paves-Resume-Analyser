package com.paves.resume_analyser.screening.campaign;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Represents a job screening campaign (one per open role/batch).
 */
@Entity
@Table(name = "screening_campaigns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String roleName;

    @Column(columnDefinition = "TEXT")
    private String jobDescription;

    /** Comma-separated list of required skills. */
    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(columnDefinition = "TEXT")
    private String niceToHaveSkills;

    private Integer minExperience;
    private Integer maxExperience;
    private Integer targetHeadcount;

    private String department;

    /** Nullable — null means the campaign is global (all branches). */
    private Long branchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CampaignStatus status = CampaignStatus.DRAFT;

    /** Username taken from the X-User-Name request header. */
    private String createdBy;

    /** JSON string storing a skill → weight map, e.g. {"Java":30,"Spring":20}. */
    @Column(columnDefinition = "TEXT")
    private String skillWeightsJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Splits {@code requiredSkills} by comma and returns a trimmed, non-empty list.
     * Returns an empty list when the field is null or blank.
     */
    public List<String> getRequiredSkillList() {
        if (requiredSkills == null || requiredSkills.isBlank()) {
            return List.of();
        }
        return Arrays.stream(requiredSkills.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
