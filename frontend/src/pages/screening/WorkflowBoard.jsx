// src/pages/screening/WorkflowBoard.jsx
import React, { useEffect, useState } from 'react';
import { workflowAPI, campaignAPI } from '../../api/screeningApi';

const STAGES = ['UPLOADED','SCREENING','SHORTLISTED','HM_REVIEW','INTERVIEW','SELECTED','REJECTED'];
const STAGE_COLORS = {
  UPLOADED: '#94a3b8', SCREENING: '#6366f1', SHORTLISTED: '#3b82f6',
  HM_REVIEW: '#f59e0b', INTERVIEW: '#8b5cf6', SELECTED: '#22c55e', REJECTED: '#ef4444',
};

const VALID_TRANSITIONS = {
  UPLOADED:    ['SCREENING','REJECTED'],
  SCREENING:   ['SHORTLISTED','REJECTED'],
  SHORTLISTED: ['HM_REVIEW','REJECTED'],
  HM_REVIEW:   ['INTERVIEW','REJECTED'],
  INTERVIEW:   ['SELECTED','REJECTED'],
  SELECTED:    [],
  REJECTED:    [],
};

export default function WorkflowBoard() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(null);

  useEffect(() => {
    campaignAPI.list().then(r => {
      const list = r.data?.content ?? r.data ?? [];
      setCampaigns(list);
      if (list.length > 0) setSelectedCampaign(list[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCampaign) return;
    setLoading(true);
    Promise.all(
      STAGES.map(stage =>
        workflowAPI.getByStage(selectedCampaign, stage)
          .then(r => [stage, r.data ?? []])
          .catch(() => [stage, []])
      )
    ).then(entries => {
      setStageData(Object.fromEntries(entries));
    }).finally(() => setLoading(false));
  }, [selectedCampaign]);

  const moveCandidate = async (resultId, fromStage, toStage) => {
    setMoving(resultId);
    try {
      await workflowAPI.moveStage(resultId, { targetStage: toStage });
      setStageData(prev => {
        const fromList = (prev[fromStage] ?? []).filter(r => r.id !== resultId);
        const moved = (prev[fromStage] ?? []).find(r => r.id === resultId);
        const toList = moved ? [...(prev[toStage] ?? []), { ...moved, candidateStage: toStage }] : (prev[toStage] ?? []);
        return { ...prev, [fromStage]: fromList, [toStage]: toList };
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Move failed');
    } finally {
      setMoving(null);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Candidate Pipeline
        </h2>
        <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.83rem', cursor: 'pointer' }}>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.roleName}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading pipeline…</p>
      ) : (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
          {STAGES.map(stage => {
            const candidates = stageData[stage] ?? [];
            const color = STAGE_COLORS[stage];
            return (
              <div key={stage} style={{ minWidth: '200px', flex: '0 0 200px' }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 10px', background: `${color}15`, borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${color}` }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.replace('_',' ')}</span>
                  <span style={{ fontSize: '0.7rem', background: `${color}30`, color, padding: '1px 7px', borderRadius: '10px', marginLeft: 'auto' }}>{candidates.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {candidates.map(result => {
                    const name = result.resume?.candidateName ?? result.candidateName ?? '—';
                    const score = result.overallScore ?? result.atsScore;
                    const allowed = VALID_TRANSITIONS[stage] ?? [];
                    return (
                      <div key={result.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                        {score != null && (
                          <p style={{ fontSize: '0.72rem', color: score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444', margin: '0 0 8px' }}>
                            Score: {Number(score).toFixed(1)}
                          </p>
                        )}
                        {allowed.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {allowed.map(next => (
                              <button key={next} disabled={moving === result.id}
                                onClick={() => moveCandidate(result.id, stage, next)}
                                style={{ fontSize: '0.65rem', padding: '3px 7px', background: `${STAGE_COLORS[next]}20`, color: STAGE_COLORS[next], border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                                → {next.replace('_',' ')}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {candidates.length === 0 && (
                    <div style={{ border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
