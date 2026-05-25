// src/components/ui/EmptyState.jsx
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mb-5 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}
