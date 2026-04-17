// src/components/resume/ATSScore.jsx
import React from 'react';
import { getScoreColor, getScoreBg } from '../../styles/common';

function ScoreRing({ score, size = 120, strokeWidth = 10, label }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const offset = circ - (pct / 100) * circ;
  const color = getScoreColor(pct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size >= 120 ? '1.6rem' : '1.1rem',
            fontWeight: '700', color: 'var(--text-primary)',
            letterSpacing: '-0.03em', lineHeight: '1',
          }}>
            {pct}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>/ 100</span>
        </div>
      </div>
      {label && (
        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'center' }}>
          {label}
        </p>
      )}
    </div>
  );
}

function MiniScore({ label, value }) {
  const color = getScoreColor(value);
  const bg = getScoreBg(value);
  const pct = Math.min(Math.max(value || 0, 0), 100);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{
          fontSize: '0.78rem', fontWeight: '700', color,
          background: bg, padding: '2px 8px', borderRadius: '20px',
        }}>
          {pct}
        </span>
      </div>
      <div style={{ height: '5px', background: 'var(--surface-3)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: '10px',
          transition: 'width 1s ease',
        }} />
      </div>
    </div>
  );
}

export default function ATSScore({ resume }) {
  if (!resume) return null;

  const { ats_score, skill_match_score, overall_score } = resume;

  return (
    <div>
      {/* Main rings */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '32px',
        flexWrap: 'wrap', marginBottom: '28px',
      }}>
        <ScoreRing score={overall_score} size={128} label="Overall Score" />
        <ScoreRing score={ats_score} size={96} strokeWidth={8} label="ATS Score" />
        <ScoreRing score={skill_match_score} size={96} strokeWidth={8} label="Skill Match" />
      </div>

      {/* Bar breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <MiniScore label="ATS Compatibility" value={ats_score} />
        <MiniScore label="Skill Match"        value={skill_match_score} />
        <MiniScore label="Overall Score"      value={overall_score} />
      </div>
    </div>
  );
}

export { ScoreRing };
