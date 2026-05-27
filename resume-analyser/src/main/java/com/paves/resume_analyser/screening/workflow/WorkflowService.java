package com.paves.resume_analyser.screening.workflow;

import com.paves.resume_analyser.screening.result.ScreeningResult;
import com.paves.resume_analyser.screening.result.ScreeningResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final ScreeningResultRepository resultRepo;

    /** Valid transitions enforced server-side. */
    private static final java.util.Map<CandidateStage, List<CandidateStage>> ALLOWED_TRANSITIONS =
            java.util.Map.of(
                    CandidateStage.UPLOADED,    List.of(CandidateStage.SCREENING, CandidateStage.REJECTED),
                    CandidateStage.SCREENING,   List.of(CandidateStage.SHORTLISTED, CandidateStage.REJECTED),
                    CandidateStage.SHORTLISTED, List.of(CandidateStage.HM_REVIEW, CandidateStage.REJECTED),
                    CandidateStage.HM_REVIEW,   List.of(CandidateStage.INTERVIEW, CandidateStage.REJECTED),
                    CandidateStage.INTERVIEW,   List.of(CandidateStage.SELECTED, CandidateStage.REJECTED),
                    CandidateStage.SELECTED,    List.of(),
                    CandidateStage.REJECTED,    List.of()
            );

    @Transactional
    public StageTransitionResponse moveStage(String resultId, MoveStageRequest req, String changedBy) {
        ScreeningResult result = resultRepo.findById(resultId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Result not found: " + resultId));

        CandidateStage current = result.getCandidateStage() != null
                ? result.getCandidateStage() : CandidateStage.UPLOADED;
        CandidateStage target = req.getTargetStage();

        List<CandidateStage> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, List.of());
        if (!allowed.contains(target)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid transition: " + current + " → " + target +
                    ". Allowed: " + allowed);
        }

        result.setCandidateStage(target);
        result.setStageChangedBy(changedBy);
        result.setStageChangedAt(LocalDateTime.now());
        if (target == CandidateStage.REJECTED && req.getRejectionReason() != null) {
            result.setRejectionReason(req.getRejectionReason());
        }
        resultRepo.save(result);

        log.info("Stage moved: result={} {} → {} by {}", resultId, current, target, changedBy);
        return new StageTransitionResponse(resultId, current, target, changedBy);
    }

    public List<ScreeningResult> getByStage(String campaignId, CandidateStage stage) {
        return resultRepo.findByCampaignIdAndCandidateStage(campaignId, stage);
    }
}
