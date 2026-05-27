package com.paves.resume_analyser.screening.workflow;

/** The recruiter-driven pipeline stage for a screened candidate. */
public enum CandidateStage {
    UPLOADED,       // Resume received; awaiting AI screening
    SCREENING,      // AI pipeline running
    SHORTLISTED,    // Recruiter shortlisted after AI recommendation
    HM_REVIEW,      // Passed to Hiring Manager for review
    INTERVIEW,      // Interview scheduled/in-progress
    SELECTED,       // Final hire decision
    REJECTED        // Rejected at any stage (reason stored separately)
}
