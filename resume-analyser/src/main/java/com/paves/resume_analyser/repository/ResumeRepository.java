package com.paves.resume_analyser.repository;

import com.paves.resume_analyser.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByBranchIdOrderByUploadedAtDesc(Long branchId);

    List<Resume> findByJobRoleIdOrderByOverallScoreDesc(Long jobRoleId);

    List<Resume> findByBranchIdAndJobRoleIdOrderByOverallScoreDesc(Long branchId, Long jobRoleId);

    // FIX: "isShortlisted" → field name on entity is isShortlisted; Spring Data resolves it correctly
    List<Resume> findByBranchIdAndIsShortlistedTrueOrderByOverallScoreDesc(Long branchId);

    long countByBranchId(Long branchId);

    long countByBranchIdAndStatus(Long branchId, Resume.ResumeStatus status);

    long countByBranchIdAndIsShortlistedTrue(Long branchId);

    List<Resume> findByBranchIdOrderByOverallScoreDesc(Long branchId);

    // FIX: Spring Data supports Top10 keyword — "Score" alone is not a field.
    // Use the actual field name "overallScore" → findTop10ByBranchIdOrderByOverallScoreDesc
    List<Resume> findTop10ByBranchIdOrderByOverallScoreDesc(Long branchId);
}