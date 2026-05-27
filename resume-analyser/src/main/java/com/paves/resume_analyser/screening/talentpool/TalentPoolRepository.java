package com.paves.resume_analyser.screening.talentpool;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TalentPoolRepository extends JpaRepository<TalentPool, String> {

    Optional<TalentPool> findByEmail(String email);

    Page<TalentPool> findAllByOrderByLastScoreDesc(Pageable pageable);

    @Query("SELECT t FROM TalentPool t WHERE " +
           "LOWER(t.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.skills)   LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.email)    LIKE LOWER(CONCAT('%', :q, '%'))")
    List<TalentPool> search(@Param("q") String query);

    List<TalentPool> findBySource(CandidateSource source);

    @Query("SELECT t FROM TalentPool t WHERE t.lastScore >= :minScore ORDER BY t.lastScore DESC")
    List<TalentPool> findByMinScore(@Param("minScore") double minScore);
}
