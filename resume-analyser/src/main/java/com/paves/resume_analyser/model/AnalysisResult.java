package com.paves.resume_analyser.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "analysis_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer atsScore;
    private Integer skillMatchScore;
    private Integer overallScore;

    @Column(columnDefinition = "TEXT")
    private String summary;
}