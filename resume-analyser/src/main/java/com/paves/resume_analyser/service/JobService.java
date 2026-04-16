package com.paves.resume_analyser.service;

import com.paves.resume_analyser.model.JobRole;
import com.paves.resume_analyser.repository.JobRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRoleRepository jobRoleRepository;

    public List<JobRole> getByBranch(Long branchId) {
        return jobRoleRepository.findByBranchIdAndIsOpenTrue(branchId);
    }
}