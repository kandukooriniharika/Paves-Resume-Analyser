// src/components/resume/ResumeCard.jsx
import React from 'react';
import { FileText, Star, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import { cardClass, getScoreColor, getScoreBg, getStatusStyle } from '../../styles/common';

export default function ResumeCard({ resume, onClick, compact = false }) {
  if (!resume) return null;

  const {
    candidate_name, candidate_email, overall_score,
    status, is_shortlisted, matched_skills = [], job_role_id,
  } = resume;

  const scoreColor = getScoreColor(overall_score);
  const statusStyle = getStatusStyle(status);

  return (
    <div
      onClick={() => onClick?.(resume)}
      style={{
        ...cardClass,
        padding: compact ? '14px 16px' : '18px 20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-start',
        gap: '14px',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Avatar */}
      <div style={{
        flexShrink: 0, width: compact ? '36px' : '44px', height: compact ? '36px' : '44px',
        borderRadius: '50%', background: `${scoreColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? '0.8rem' : '1rem', fontWeight: '600', color: scoreColor,
      }}>
        {candidate_name?.charAt(0)?.toUpperCase() || <FileText size={16} />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <p style={{
            fontWeight: '600', fontSize: compact ? '0.85rem' : '0.9rem',
            color: 'var(--text-primary)', letterSpacing: '-0.01em',
          }} className="truncate">
            {candidate_name}
          </p>
          {is_shortlisted && <Star size={12} fill="var(--warning)" color="var(--warning)" />}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="truncate">
          {candidate_email}
        </p>

        {!compact && matched_skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {matched_skills.slice(0, 4).map((skill, i) => (
              <Badge key={i} variant="accent" size="sm">{skill}</Badge>
            ))}
            {matched_skills.length > 4 && (
              <Badge variant="default" size="sm">+{matched_skills.length - 4}</Badge>
            )}
          </div>
        )}
      </div>

      {/* Score + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
        <div style={{
          fontSize: compact ? '1rem' : '1.2rem', fontWeight: '700',
          color: scoreColor, letterSpacing: '-0.03em',
          background: getScoreBg(overall_score),
          padding: '3px 10px', borderRadius: '8px',
        }}>
          {overall_score ?? '—'}
        </div>
        <Badge
          variant={status === 'shortlisted' ? 'success' : status === 'analysed' ? 'accent' : 'default'}
          size="sm"
        >
          {status || 'pending'}
        </Badge>
      </div>

      <ChevronRight size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
    </div>
  );
}
