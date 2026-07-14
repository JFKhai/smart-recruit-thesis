import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillTagProps {
  skill: string
  onRemove?: (skill: string) => void
  removable?: boolean
  variant?: 'default' | 'match' | 'missing'
  className?: string
}

export default function SkillTag({
  skill,
  onRemove,
  removable = false,
  variant = 'default',
  className,
}: SkillTagProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    match: 'bg-green-50 text-green-700 border-green-200',
    missing: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
        variantClasses[variant],
        className
      )}
    >
      <span>{skill}</span>
      {removable && (
        <button
          onClick={() => onRemove?.(skill)}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition"
          aria-label={`Remove ${skill}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
