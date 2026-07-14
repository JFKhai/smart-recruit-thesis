import React from 'react'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface AIBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export default function AIBadge({ size = 'md', text = 'AI Powered', className }: AIBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200',
        sizeClasses[size],
        className
      )}
    >
      <Sparkles className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      {/* <span>{text}</span> */}
    </div>
  )
}
