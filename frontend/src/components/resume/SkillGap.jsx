// src/components/resume/SkillGap.jsx
import React from 'react';
import { CheckCircle, XCircle, Lightbulb, Zap } from 'lucide-react';
import Badge from '../ui/Badge';

function Section({ icon: Icon, title, iconColor, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Icon size={15} color={iconColor} />
        <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

export default function SkillGap({ resume }) {
  if (!resume) return null;

  const { matched_skills = [], missing_skills = [], suggestions = [], strengths = [] } = resume;

  return (
    <div>
      {matched_skills.length > 0 && (
        <Section icon={CheckCircle} title="Matched Skills" iconColor="var(--success)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {matched_skills.map((skill, i) => (
              <Badge key={i} variant="success">{skill}</Badge>
            ))}
          </div>
        </Section>
      )}

      {missing_skills.length > 0 && (
        <Section icon={XCircle} title="Missing Skills" iconColor="var(--danger)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {missing_skills.map((skill, i) => (
              <Badge key={i} variant="danger">{skill}</Badge>
            ))}
          </div>
        </Section>
      )}

      {strengths.length > 0 && (
        <Section icon={Zap} title="Strengths" iconColor="var(--warning)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {strengths.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '8px 12px', background: 'var(--warning-light)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {suggestions.length > 0 && (
        <Section icon={Lightbulb} title="AI Suggestions" iconColor="var(--accent)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', background: 'var(--accent-light)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <span style={{
                  flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  fontWeight: '600', color: 'var(--accent)', paddingTop: '2px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{s}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
