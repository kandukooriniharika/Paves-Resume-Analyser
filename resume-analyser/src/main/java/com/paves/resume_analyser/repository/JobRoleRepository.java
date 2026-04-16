package com.paves.resume_analyser.repository;

import com.paves.resume_analyser.model.JobRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRoleRepository extends JpaRepository<JobRole, Long> {

    List<JobRole> findByBranchId(Long branchId);

    List<JobRole> findByBranchIdAndIsOpenTrue(Long branchId);

    long countByBranchIdAndIsOpenTrue(Long branchId);
}