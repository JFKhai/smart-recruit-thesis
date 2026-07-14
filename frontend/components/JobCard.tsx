import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MatchBadge from '@/components/MatchBadge'
import SkillTag from '@/components/SkillTag'
import AIBadge from '@/components/AIBadge'
import { MapPin, DollarSign, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobCardProps {
  id: string
  title: string
  company: string
  logo?: string
  location: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  workType: 'remote' | 'hybrid' | 'onsite'
  skills: string[]
  matchScore?: number
  aiInsight?: string
  postedDate?: Date
  onClick?: () => void
  className?: string
  showActions?: boolean
}

export default function JobCard({
  id,
  title,
  company,
  logo,
  location,
  salaryMin,
  salaryMax,
  currency = 'USD',
  workType,
  skills,
  matchScore,
  aiInsight,
  postedDate,
  onClick,
  className,
  showActions = false,
}: JobCardProps) {
  const workTypeColor = {
    remote: 'bg-blue-50 text-blue-700 border-blue-200',
    hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
    onsite: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <Card
      className={cn(
        'p-6 hover:shadow-lg transition-all cursor-pointer border border-border',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 flex-1">
          {logo && (
            <img
              src={logo}
              alt={company}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground line-clamp-2">{title}</h3>
            <p className="text-sm text-foreground/70">{company}</p>
          </div>
        </div>
        {matchScore !== undefined && (
          <div className="flex-shrink-0">
            <MatchBadge score={matchScore} size="sm" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-foreground/70">
          <MapPin className="w-4 h-4" />
          {location}
        </div>
        <Badge variant="outline" className={cn('border', workTypeColor[workType])}>
          {workType.charAt(0).toUpperCase() + workType.slice(1)}
        </Badge>
      </div>

      {(salaryMin || salaryMax) && (
        <div className="flex items-center gap-1 mb-4 text-sm font-semibold text-green-700">
          <DollarSign className="w-4 h-4" />
          {salaryMin && salaryMax
            ? `${salaryMin.toLocaleString()}-${salaryMax.toLocaleString()} ${currency}`
            : salaryMin
              ? `${salaryMin.toLocaleString()}+ ${currency}`
              : `${salaryMax?.toLocaleString()} ${currency}`}
        </div>
      )}

      {aiInsight && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AIBadge size="sm" text="AI Insight" className="flex-shrink-0" />
            <p className="text-sm text-blue-700">{aiInsight}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center flex-wrap gap-2">
          {skills.slice(0, 4).map((skill, index) => (
            <SkillTag key={`${skill}-${index}`} skill={skill} />
          ))}
          {skills.length > 4 && (
            <span className="text-xs text-foreground/60">+{skills.length - 4} more</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        {postedDate && (
          <p className="text-xs text-foreground/50">
            Posted{' '}
            {Math.floor(
              (new Date().getTime() - new Date(postedDate).getTime()) / (1000 * 60 * 60 * 24)
            )}{' '}
            days ago
          </p>
        )}
        {showActions && (
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/jobs/${id}`}>View Details</Link>
            </Button>
            <Button size="sm">Apply Now</Button>
          </div>
        )}
      </div>
    </Card>
  )
}
