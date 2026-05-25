package com.paves.resume_analyser.screening.result.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HROverrideRequest {

    private Double hrOverrideScore;
    private String hrNotes;

    /** Must be "SHORTLISTED" or "REJECTED". */
    private String hrStatus;
}
