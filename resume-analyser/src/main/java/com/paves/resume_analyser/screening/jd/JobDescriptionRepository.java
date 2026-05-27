package com.paves.resume_analyser.screening.jd;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, String> {

    List<JobDescription> findByStatusOrderByCreatedAtDesc(JdStatus status);

    List<JobDescription> findByParentIdOrderByVersionDesc(String parentId);

    List<JobDescription> findAllByOrderByCreatedAtDesc();
}
