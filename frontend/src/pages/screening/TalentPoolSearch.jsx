// src/pages/screening/TalentPoolSearch.jsx
import React, { useState } from 'react';
import { Search, Users, Loader } from 'lucide-react';
import { talentPoolAPI } from '../../api/screeningApi';

const SOURCE_COLORS = { WEBSITE: '#6366f1', LINKEDIN: '#0077b5', NAUKRI: '#f97316', MANUAL: '#94a3b8' };

export default function TalentPoolSearch() {
  const [mode, setMode] = useState('keyword');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const res = mode === 'keyword'
        ? await talentPoolAPI.search(query)
        : await talentPoolAPI.semanticSearch(query, null, 10);
      setResults(res.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Talent Pool Search
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
          Search across all candidates ever screened. Semantic search understands meaning, not just keywords.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {[['keyword', 'Keyword Search'], ['semantic', 'AI Semantic Search']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', background: mode === m ? 'var(--accent)' : 'var(--surface-2)', color: mode === m ? '#fff' : 'var(--text-secondary)' }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'semantic' && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '10px', fontStyle: 'italic' }}>
          Try: "backend engineers with Redis and AWS" or "frontend developers with React and TypeScript"
        </p>
      )}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={mode === 'keyword' ? 'Search by name, email, or skills…' : 'Describe the candidate you need…'}
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" disabled={loading}
          style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
          {loading ? <Loader size={14} /> : 'Search'}
        </button>
      </form>

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          <Users size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p>No candidates found for "{query}"</p>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((c, i) => {
            const name = c.fullName ?? c.candidate_name ?? '—';
            const email = c.email ?? c.candidate_email ?? '—';
            const score = c.lastScore ?? c.overall_score ?? c.score;
            const src = c.source ?? 'MANUAL';
            const skills = typeof c.skills === 'string' ? c.skills : '';
            return (
              <div key={c.id ?? c.resume_id ?? i} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0 }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{name}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: '600', color: SOURCE_COLORS[src], background: `${SOURCE_COLORS[src]}20`, padding: '2px 7px', borderRadius: '10px' }}>{src}</span>
                  </div>
                  <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{email}</p>
                  {skills && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                      {skills.split(',').slice(0, 6).join(' · ')}
                    </p>
                  )}
                </div>
                {score != null && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {typeof score === 'number' ? score.toFixed(1) : score}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>ATS Score</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
