const splitList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStatus = (status) => {
  if (!status) {
    return 'pending';
  }

  return String(status).toLowerCase();
};

const decodeJwtPayload = (token) => {
  if (!token || typeof window === 'undefined' || typeof window.atob !== 'function') {
    return {};
  }

  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return {};
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(window.atob(normalized + padding));
  } catch {
    return {};
  }
};

export const normalizeUser = (token, rawUser = {}) => {
  const claims = decodeJwtPayload(token);
  const source = rawUser && typeof rawUser === 'object' ? rawUser : {};

  return {
    id: source.id ?? source.userId ?? claims.userId ?? null,
    email: source.email ?? claims.sub ?? null,
    full_name: source.full_name ?? source.fullName ?? null,
    role: source.role ?? claims.role ?? null,
    branch_id: source.branch_id ?? source.branchId ?? claims.branchId ?? null,
  };
};

export const normalizeLoginPayload = (payload) => {
  const token = (typeof payload === 'string'
    ? payload
    : payload?.token ?? payload?.accessToken ?? payload?.jwt ?? '').trim();

  const rawUser =
    payload && typeof payload === 'object'
      ? payload.user ?? payload.account ?? payload.profile ?? {}
      : {};

  return {
    token,
    user: normalizeUser(token, rawUser),
  };
};

export const normalizeBranch = (branch) => ({
  id: branch?.id ?? null,
  name: branch?.name ?? branch?.branchName ?? '',
  code: branch?.code ?? '',
  location: branch?.location ?? '',
  country: branch?.country ?? '',
  timezone: branch?.timezone ?? '',
  is_active: Boolean(branch?.is_active ?? branch?.active ?? branch?.isActive),
});

export const normalizeBranchList = (branches = []) =>
  Array.isArray(branches) ? branches.map(normalizeBranch) : [];

export const normalizeBranchSummary = (summary) => ({
  id: summary?.id ?? summary?.branchId ?? null,
  name: summary?.name ?? summary?.branchName ?? '',
  total_resumes: toNumber(summary?.total_resumes ?? summary?.totalResumes) ?? 0,
  shortlisted: toNumber(summary?.shortlisted) ?? 0,
  avg_score: toNumber(summary?.avg_score ?? summary?.avgScore) ?? 0,
  open_positions: toNumber(summary?.open_positions ?? summary?.openPositions) ?? 0,
});

export const normalizeBranchSummaryList = (summaries = []) =>
  Array.isArray(summaries) ? summaries.map(normalizeBranchSummary) : [];

export const normalizeJob = (job) => ({
  id: job?.id ?? null,
  title: job?.title ?? '',
  description: job?.description ?? '',
  required_skills: splitList(job?.required_skills ?? job?.requiredSkills),
  nice_to_have_skills: splitList(job?.nice_to_have_skills ?? job?.niceToHaveSkills),
  min_experience_years:
    toNumber(job?.min_experience_years ?? job?.minExperienceYears) ?? 0,
  max_experience_years:
    toNumber(job?.max_experience_years ?? job?.maxExperienceYears) ?? 0,
  is_open: Boolean(job?.is_open ?? job?.open ?? job?.isOpen),
  target_headcount: toNumber(job?.target_headcount ?? job?.targetHeadcount) ?? 0,
  current_applications:
    toNumber(job?.current_applications ?? job?.currentApplications) ?? 0,
});

export const normalizeJobList = (jobs = []) =>
  Array.isArray(jobs) ? jobs.map(normalizeJob) : [];

export const normalizeResume = (resume) => ({
  id: resume?.id ?? null,
  candidate_name: resume?.candidate_name ?? resume?.candidateName ?? '',
  candidate_email: resume?.candidate_email ?? resume?.candidateEmail ?? '',
  candidate_phone: resume?.candidate_phone ?? resume?.candidatePhone ?? '',
  file_url: resume?.file_url ?? resume?.fileUrl ?? '',
  public_id: resume?.public_id ?? resume?.publicId ?? '',
  extracted_text: resume?.extracted_text ?? resume?.extractedText ?? '',
  ats_score: toNumber(resume?.ats_score ?? resume?.atsScore),
  skill_match_score: toNumber(resume?.skill_match_score ?? resume?.skillMatchScore),
  overall_score: toNumber(resume?.overall_score ?? resume?.overallScore),
  matched_skills: splitList(resume?.matched_skills ?? resume?.matchedSkills),
  missing_skills: splitList(resume?.missing_skills ?? resume?.missingSkills),
  suggestions: splitList(resume?.suggestions),
  strengths: splitList(resume?.strengths),
  ai_summary: resume?.ai_summary ?? resume?.aiSummary ?? '',
  status: normalizeStatus(resume?.status),
  is_shortlisted: Boolean(
    resume?.is_shortlisted ?? resume?.shortlisted ?? resume?.isShortlisted
  ),
  shortlist_notes: resume?.shortlist_notes ?? resume?.shortlistNotes ?? '',
  shortlisted_at: resume?.shortlisted_at ?? resume?.shortlistedAt ?? null,
  uploaded_at: resume?.uploaded_at ?? resume?.uploadedAt ?? null,
  analysed_at: resume?.analysed_at ?? resume?.analysedAt ?? null,
});

export const normalizeResumeList = (resumes = []) =>
  Array.isArray(resumes) ? resumes.map(normalizeResume) : [];
