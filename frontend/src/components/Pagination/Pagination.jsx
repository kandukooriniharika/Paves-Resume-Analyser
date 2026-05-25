// src/components/Pagination/Pagination.jsx
import React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;
  const atStart = page <= 0;
  const atEnd = page >= totalPages - 1;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={atStart}
        className={clsx(
          'p-1.5 rounded-md transition',
          atStart ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600',
        )}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'min-w-[32px] h-8 rounded-md text-sm font-medium transition',
              p === page
                ? 'bg-[#212d74] text-white'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {p + 1}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={atEnd}
        className={clsx(
          'p-1.5 rounded-md transition',
          atEnd ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600',
        )}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
