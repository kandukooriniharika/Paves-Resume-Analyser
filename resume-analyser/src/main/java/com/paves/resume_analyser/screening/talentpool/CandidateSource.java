package com.paves.resume_analyser.screening.talentpool;

public enum CandidateSource {
    WEBSITE,    // Applied via company career page
    LINKEDIN,   // Came in via LinkedIn Apply Connect webhook
    NAUKRI,     // Imported from Naukri recruiter XLSX export
    MANUAL      // Manually uploaded by a recruiter
}
