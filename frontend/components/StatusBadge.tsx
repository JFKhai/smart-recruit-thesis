import React from 'react'
import { cn } from '@/lib/utils'

type Status = 'applied' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'active' | 'paused' | 'closed'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  applied: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Applied' },
  reviewing: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Under Review' },
  interview: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Interview' },
  accepted: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
  active: { bg: 'bg-green-50', text: 'text-green-700', label: 'Active' },
  paused: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Paused' },
  closed: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Closed' },
}

export default function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        config.bg,
        config.text,
        'border-opacity-30',
        sizeClasses[size],
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current opacity-70" />
      <span>{config.label}</span>
    </div>
  )
}
