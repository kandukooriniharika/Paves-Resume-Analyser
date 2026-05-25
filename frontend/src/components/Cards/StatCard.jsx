// src/components/Cards/StatCard.jsx
import React from 'react';
import clsx from 'clsx';

const TONES = {
  slate:  { bg: 'bg-slate-50',   icon: 'bg-slate-100 text-slate-600',    val: 'text-slate-800'   },
  blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',      val: 'text-blue-800'    },
  green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600',val: 'text-emerald-800' },
  red:    { bg: 'bg-rose-50',    icon: 'bg-rose-100 text-rose-600',      val: 'text-rose-800'    },
  yellow: { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',    val: 'text-amber-800'   },
  violet: { bg: 'bg-violet-50',  icon: 'bg-violet-100 text-violet-600',  val: 'text-violet-800'  },
};

export default function StatCard({ label, value, icon: Icon, tone = 'slate', sub, className = '' }) {
  const t = TONES[tone] ?? TONES.slate;
  return (
    <div
      className={clsx(
        'rounded-xl p-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform',
        t.bg,
        className,
      )}
    >
      {Icon && (
        <div
          className={clsx(
            'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
            t.icon,
          )}
        >
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        <p className={clsx('text-2xl font-bold tabular-nums', t.val)}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
