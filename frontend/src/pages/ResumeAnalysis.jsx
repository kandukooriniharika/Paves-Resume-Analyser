// src/pages/ResumeAnalysis.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, StarOff, FileText, Mail, Phone,
  Calendar, ExternalLink, Brain, ChevronRight,
} from 'lucide-react';
import ATSScore from '../components/resume/ATSScore';
import SkillGap from '../components/resume/SkillGap';
import Badge from '../components/ui/Badge';
import useResumeStore from '../store/resumeStore';
import { cardClass, pageTitleClass, headingClass, primaryBtn, secondaryBtn, getStatusStyle } from '../styles/common';

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <Icon size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '500', minWidth: '80px' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '400' }}>{value}</span>
    </div>
  );
}

export default function ResumeAnalysis() {
  const navigate = useNavigate();
  const { selectedResume, shortlistResume, setSelectedResume } = useResumeStore();
  const [shortlisting, setShortlisting] = useState(false);
  const [shortlistNote, setShortlistNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [activeTab, setActiveTab] = useState('scores');

  if (!selectedResume) {
    return (
      <div className="page-container animate-fadeUp" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <FileText size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px', opacity: 0.4 }} />
        <h2 style={{ ...headingClass, fontSize: '1.1rem', marginBottom: '8px' }}>No resume selected</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Select a resume from the Resumes list to view the analysis.
        </p>
        <button onClick={() => navigate('/resumes')} style={primaryBtn}>
          Browse Resumes <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  const {
    candidate_name, candidate_email, candidate_phone,
    uploaded_at, analysed_at, status, is_shortlisted,
    ai_summary, file_url, job_role_id,
  } = selectedResume;

  const statusStyle = getStatusStyle(status);

  const handleShortlist = async () => {
    setShortlisting(true);
    try {
      const updated = await shortlistResume(selectedResume.id, shortlistNote);
      setSelectedResume(updated);
      setShowNoteInput(false);
      setShortlistNote('');
    } catch (err) {
      alert('Failed to shortlist. Please try again.');
    } finally {
      setShortlisting(false);
    }
  };

  const tabs = [
    { id: 'scores',   label: 'ATS Scores' },
    { id: 'skills',   label: 'Skill Analysis' },
    { id: 'summary',  label: 'AI Summary' },
  ];

  return (
    <div className="page-container animate-fadeUp">
      {/* Back */}
      <button
        onClick={() => navigate('/resumes')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
          marginBottom: '20px', padding: '0',
        }}
      >
        <ArrowLeft size={14} /> Back to Resumes
      </button>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={pageTitleClass}>{candidate_name}</h1>
            <Badge style={statusStyle}>{status || 'pending'}</Badge>
            {is_shortlisted && <Badge variant="warning"><Star size={11} fill="currentColor" /> Shortlisted</Badge>}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{candidate_email}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {file_url && (
            <a href={file_url} target="_blank" rel="noopener noreferrer">
              <button style={secondaryBtn}>
                <ExternalLink size={13} /> View Resume
              </button>
            </a>
          )}
          <button
            onClick={() => is_shortlisted ? null : setShowNoteInput(s => !s)}
            disabled={is_shortlisted || shortlisting}
            style={{
              ...primaryBtn,
              background: is_shortlisted ? 'var(--success)' : 'var(--accent)',
              opacity: is_shortlisted ? 0.85 : 1,
              gap: '6px',
            }}
          >
            {is_shortlisted
              ? <><Star size={14} fill="#fff" /> Shortlisted</>
              : shortlisting
              ? <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : <><StarOff size={14} /> Shortlist</>
            }
          </button>
        </div>
      </div>

      {/* Shortlist note input */}
      {showNoteInput && !is_shortlisted && (
        <div style={{ ...cardClass, marginBottom: '20px', background: 'var(--accent-light)', border: '1px solid var(--accent)' }} className="animate-fadeIn">
          <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--accent)', marginBottom: '10px' }}>
            Add a note (optional)
          </p>
          <textarea
            value={shortlistNote}
            onChange={e => setShortlistNote(e.target.value)}
            placeholder="e.g. Strong React skills, good culture fit…"
            rows={2}
            style={{
              width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-primary)',
              resize: 'none', outline: 'none', background: 'var(--surface)', fontFamily: 'var(--font)',
              marginBottom: '10px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleShortlist} disabled={shortlisting} style={{ ...primaryBtn, fontSize: '0.82rem' }}>
              Confirm Shortlist
            </button>
            <button onClick={() => setShowNoteInput(false)} style={{ ...secondaryBtn, fontSize: '0.82rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left — candidate info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={cardClass}>
            <h3 style={{ ...headingClass, marginBottom: '4px' }}>Candidate</h3>
            <div>
              <InfoRow icon={Mail}     label="Email"     value={candidate_email} />
              <InfoRow icon={Phone}    label="Phone"     value={candidate_phone} />
              <InfoRow icon={Calendar} label="Uploaded"  value={uploaded_at ? new Date(uploaded_at).toLocaleDateString() : null} />
              <InfoRow icon={Brain}    label="Analysed"  value={analysed_at ? new Date(analysed_at).toLocaleDateString() : null} />
            </div>
          </div>

          {/* Quick score summary */}
          <div style={cardClass}>
            <h3 style={{ ...headingClass, marginBottom: '14px' }}>Quick Scores</h3>
            {[
              { label: 'Overall',    value: selectedResume.overall_score },
              { label: 'ATS',        value: selectedResume.ats_score },
              { label: 'Skill Match',value: selectedResume.skill_match_score },
            ].map(({ label, value }) => {
              const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : 'var(--danger)';
              return (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color }}>{value ?? '—'}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '10px' }}>
                    <div style={{ height: '100%', width: `${value || 0}%`, background: color, borderRadius: '10px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — tabbed analysis */}
        <div>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '4px',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
            padding: '4px', marginBottom: '20px', width: 'fit-content',
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '7px 16px', borderRadius: '6px', border: 'none',
                  background: activeTab === t.id ? 'var(--surface)' : 'transparent',
                  color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === t.id ? '600' : '400',
                  fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: activeTab === t.id ? 'var(--shadow)' : 'none',
                  fontFamily: 'var(--font)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div key={activeTab} className="animate-fadeIn">
            {activeTab === 'scores' && (
              <div style={cardClass}>
                <ATSScore resume={selectedResume} />
              </div>
            )}

            {activeTab === 'skills' && (
              <div style={cardClass}>
                <SkillGap resume={selectedResume} />
              </div>
            )}

            {activeTab === 'summary' && (
              <div style={cardClass}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Brain size={15} color="var(--accent)" />
                  <h3 style={headingClass}>AI Summary</h3>
                </div>
                {ai_summary ? (
                  <p style={{
                    fontSize: '0.88rem', color: 'var(--text-secondary)',
                    lineHeight: '1.75', whiteSpace: 'pre-wrap',
                  }}>
                    {ai_summary}
                  </p>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
                    No AI summary available for this resume.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
