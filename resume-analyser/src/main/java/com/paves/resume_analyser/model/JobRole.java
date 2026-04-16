package com.paves.resume_analyser.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "job_roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = {"branch", "resume"})
@ToString(exclude = {"branch", "resume"})
public class JobRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(columnDefinition = "TEXT")
    private String niceToHaveSkills;

    private Integer minExperienceYears;
    private Integer maxExperienceYears;

    @Builder.Default
    private boolean isOpen = true;

    private Integer targetHeadcount;
    private Integer currentApplications;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // FIX: reference name matches Branch.jobRole @JsonManagedReference("branch-jobrole")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonBackReference("branch-jobrole")
    private Branch branch;

    @OneToMany(mappedBy = "jobRole", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("jobrole-resume")
    private List<Resume> resume;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
