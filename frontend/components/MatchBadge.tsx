import React from 'react'
import { cn } from '@/lib/utils'

interface MatchBadgeProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function MatchBadge({ score, size = 'md', showLabel = true, className }: MatchBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold border',
        getColor(score),
        sizeClasses[size],
        className
      )}
    >
      <span>{score}%</span>
      {showLabel && <span>Match</span>}
    </div>
  )
}
