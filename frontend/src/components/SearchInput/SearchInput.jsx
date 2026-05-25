// src/components/SearchInput/SearchInput.jsx
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}) {
  const [local, setLocal] = useState(value ?? '');

  // Debounce: fire onChange 300ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      if (onChange) onChange(local);
    }, 300);
    return () => clearTimeout(t);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep local in sync if parent resets value
  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  return (
    <div className={clsx('relative', className)}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="search"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2',
          'text-sm text-gray-900 placeholder-gray-400',
          'transition focus:outline-none focus:ring-2 focus:ring-[#212d74]/30 focus:border-[#212d74]',
          'hover:border-gray-300',
        )}
      />
    </div>
  );
}
