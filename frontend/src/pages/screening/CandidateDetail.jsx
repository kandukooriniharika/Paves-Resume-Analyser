// src/pages/screening/CandidateDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, CheckCircle, AlertTriangle, UserCheck,
  UserX, Mail, Phone, Briefcase, Award,
} from 'lucide-react';
import { screeningAPI } from '../../api/screeningApi';
import Button from '../../components/Button/Button';
import StatusBadge from '../../components/status/StatusBadge';

function ScoreCircle({ score, label }) {
  const color =
    score >= 80 ? '#28a745' :
    score >= 60 ? '#f5a623' : '#d32f2f';
  const bg =
    score >= 80 ? '#e8f5e9' :
    score >= 60 ? '#fff8e6' : '#fce8e8';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        border: `4px solid ${color}`, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.3rem', fontWeight: '800', color }}>{score ?? '—'}</span>
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>{label}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px' }}>{title}</h3>
      {children}
    </div>
  );
}

function Chip({ label, color = '#28a745', bg = '#e8f5e9' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: '99px', fontSize: '0.78rem', fontWeight: '500',
      color, background: bg,
    }}>
      {label}
    </span>
  );
}

export default function CandidateDetail() {
  const navigate = useNavigate();
  const { id: resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // HR actions
  const [actioning, setActioning] = useState(null);
  const [hrStatus, setHrStatus] = useState(null);

  // Override form
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await screeningAPI.getResultDetail(resultId);
        setResult(res.data);
        setHrStatus(res.data.hrStatus ?? null);
        if (res.data.hrOverrideScore != null) setOverrideScore(String(res.data.hrOverrideScore));
        if (res.data.hrNotes) setOverrideNotes(res.data.hrNotes);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load candidate detail.');
      } finally {
        setLoading(false);
      }
    })();
  }, [resultId]);

  const handleShortlist = async () => {
    setActioning('shortlist');
    try {
      await screeningAPI.shortlist(resultId);
      setHrStatus('SHORTLISTED');
    } catch (err) {
      alert(err.response?.data?.message || 'Shortlist failed.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    setActioning('reject');
    try {
      await screeningAPI.reject(resultId);
      setHrStatus('REJECTED');
    } catch (err) {
      alert(err.response?.data?.message || 'Reject failed.');
    } finally {
      setActioning(null);
    }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    setOverrideError('');
    if (!overrideScore) { setOverrideError('Override score is required.'); return; }
    const score = Number(overrideScore);
    if (isNaN(score) || score < 0 || score > 100) { setOverrideError('Score must be between 0 and 100.'); return; }
    setOverriding(true);
    try {
      await screeningAPI.hrOverride(resultId, {
        hrOverrideScore: score,
        hrNotes: overrideNotes,
        hrStatus,
      });
      setOverrideSuccess(true);
      setResult(r => ({ ...r, hrOverrideScore: score, hrNotes: overrideNotes, overallScore: score }));
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Override failed.');
    } finally {
      setOverriding(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '760px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: i === 1 ? '100px' : '140px', borderRadius: 'var(--radius)' }} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '14px 16px',
          fontSize: '0.85rem', color: 'var(--danger)',
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const matchedSkills = result.matchedSkillList ?? result.matchedSkills ?? result.matched_skills ?? [];
  const missingSkills = result.missingSkillList ?? result.missingSkills ?? result.missing_skills ?? [];
  const strengths = result.strengthList ?? result.strengths ?? [];
  const weaknesses = result.weaknessList ?? result.weaknesses ?? result.areasToImprove ?? [];
  const aiFeedback = result.aiFeedback ?? result.ai_feedback ?? result.feedback ?? '';
  const layer1Score = result.layer1Score ?? result.l1Score;
  const layer2Score = result.layer2Score ?? result.l2Score;
  const layer3Score = result.layer3Score ?? result.l3Score;
  const atsScore = result.atsScore ?? result.finalScore;

  const alreadyActed = hrStatus === 'SHORTLISTED' || hrStatus === 'REJECTED';

  return (
    <div className="page-container animate-fadeUp">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'none', border: 'none', marginBottom: '20px', cursor: 'pointer' }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Candidate Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--accent-nav)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>
              {(result.candidateName ?? result.name ?? '?')[0].toUpperCase()}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {result.candidateName ?? result.name ?? 'Unknown Candidate'}
              </h1>
              <StatusBadge status={result.recommendation} size="md" />
              {hrStatus && <StatusBadge status={hrStatus} size="md" />}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {result.candidateEmail && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <Mail size={13} /> {result.candidateEmail}
                </span>
              )}
              {result.candidatePhone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <Phone size={13} /> {result.candidatePhone}
                </span>
              )}
              {(result.currentRole || result.currentTitle) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <Briefcase size={13} /> {result.currentRole ?? result.currentTitle}
                </span>
              )}
            </div>
          </div>

          {/* Score circles */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {layer1Score != null && <ScoreCircle score={layer1Score} label="Layer 1" />}
            {layer2Score != null && <ScoreCircle score={layer2Score} label="Layer 2" />}
            {layer3Score != null && <ScoreCircle score={layer3Score} label="Layer 3" />}
            {atsScore != null && <ScoreCircle score={atsScore} label="ATS Score" />}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Matched Skills */}
          {matchedSkills.length > 0 && (
            <Section title="Matched Skills">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matchedSkills.map((s, i) => (
                  <Chip key={i} label={typeof s === 'string' ? s : s.name ?? s} color="#28a745" bg="#e8f5e9" />
                ))}
              </div>
            </Section>
          )}

          {/* Missing Skills */}
          {missingSkills.length > 0 && (
            <Section title="Missing Skills">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {missingSkills.map((s, i) => (
                  <Chip key={i} label={typeof s === 'string' ? s : s.name ?? s} color="#6e6e73" bg="var(--surface-3)" />
                ))}
              </div>
            </Section>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <Section title="Strengths">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {strengths.map((s, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <CheckCircle size={14} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    {typeof s === 'string' ? s : s.text ?? s.value ?? JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <Section title="Areas to Improve">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weaknesses.map((w, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <AlertTriangle size={14} color="var(--warning)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    {typeof w === 'string' ? w : w.text ?? w.value ?? JSON.stringify(w)}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* AI Feedback */}
          {aiFeedback && (
            <Section title="AI Feedback">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {aiFeedback}
              </p>
            </Section>
          )}
        </div>

        {/* Right column: HR Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Section title="HR Actions">
            {/* Current HR status indicator */}
            {hrStatus && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Current Status: </span>
                <StatusBadge status={hrStatus} size="sm" />
              </div>
            )}

            {/* Shortlist / Reject buttons */}
            {!alreadyActed ? (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button
                  variant="success"
                  size="medium"
                  loading={actioning === 'shortlist'}
                  loadingText="Saving…"
                  onClick={handleShortlist}
                >
                  <UserCheck size={14} /> Shortlist
                </Button>
                <Button
                  variant="danger"
                  size="medium"
                  loading={actioning === 'reject'}
                  loadingText="Saving…"
                  onClick={handleReject}
                >
                  <UserX size={14} /> Reject
                </Button>
              </div>
            ) : (
              <div style={{ marginBottom: '20px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <Award size={13} style={{ display: 'inline', marginRight: '5px' }} />
                This candidate has been <strong>{hrStatus?.toLowerCase()}</strong>.
              </div>
            )}

            {/* Override section */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Score Override
              </h4>

              {/* Show existing override */}
              {result.hrOverrideScore != null && !overrideSuccess && (
                <div style={{ padding: '10px 12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.82rem', color: 'var(--accent-nav)' }}>
                  <p><strong>Override Score:</strong> {result.hrOverrideScore}</p>
                  {result.hrNotes && <p style={{ marginTop: '4px' }}><strong>Notes:</strong> {result.hrNotes}</p>}
                </div>
              )}

              {overrideSuccess && (
                <div style={{ padding: '10px 12px', background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.82rem', color: 'var(--success)' }}>
                  Override saved successfully.
                </div>
              )}

              {overrideError && (
                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '8px' }}>{overrideError}</p>
              )}

              <form onSubmit={handleOverride} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Override Score (0–100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overrideScore}
                    onChange={e => setOverrideScore(e.target.value)}
                    placeholder="e.g. 85"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)', fontSize: '0.85rem',
                      outline: 'none', background: 'var(--surface)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-nav)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={overrideNotes}
                    onChange={e => setOverrideNotes(e.target.value)}
                    placeholder="Reason for override…"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)', fontSize: '0.85rem',
                      outline: 'none', resize: 'vertical', background: 'var(--surface)',
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-nav)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
                <Button type="submit" variant="primary" size="small" loading={overriding} loadingText="Saving…">
                  Save Override
                </Button>
              </form>
            </div>
          </Section>

          {/* Score breakdown summary */}
          {(layer1Score != null || layer2Score != null || atsScore != null) && (
            <Section title="Score Breakdown">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Layer 1 (Keyword)', value: layer1Score },
                  { label: 'Layer 2 (Semantic)', value: layer2Score },
                  { label: 'Layer 3 (Deep AI)', value: layer3Score },
                  { label: 'ATS Score', value: atsScore },
                ].filter(x => x.value != null).map(({ label, value }) => {
                  const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : 'var(--danger)';
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color }}>{value}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: '99px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
