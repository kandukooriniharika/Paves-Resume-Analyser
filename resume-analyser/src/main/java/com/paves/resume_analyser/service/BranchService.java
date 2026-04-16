package com.paves.resume_analyser.service;

import com.paves.resume_analyser.dto.BranchSummaryDTO;
import com.paves.resume_analyser.model.Branch;
import com.paves.resume_analyser.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final ResumeRepository resumeRepository;
    private final JobRoleRepository jobRoleRepository;

    public List<Branch> getAllBranches() {
        return branchRepository.findByIsActiveTrue();
    }

    public List<BranchSummaryDTO> getBranchSummary() {
        return branchRepository.findAll().stream().map(branch -> {

            // FIX: use findByBranchIdOrderByOverallScoreDesc (exists in fixed repo)
            List<Double> scores = resumeRepository
                    .findByBranchIdOrderByOverallScoreDesc(branch.getId())
                    .stream()
                    .map(r -> r.getOverallScore() != null ? r.getOverallScore().doubleValue() : 0.0)
                    .collect(Collectors.toList());

            double avg = scores.isEmpty()
                    ? 0.0
                    : scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

            return BranchSummaryDTO.builder()
                    .branchId(branch.getId())
                    .branchName(branch.getName())
                    .totalResumes(resumeRepository.countByBranchId(branch.getId()))
                    .shortlisted(resumeRepository.countByBranchIdAndIsShortlistedTrue(branch.getId()))
                    .avgScore(avg)
                    .openPositions(jobRoleRepository.countByBranchIdAndIsOpenTrue(branch.getId()))
                    .build();

        }).collect(Collectors.toList());
    }
}