'use client'

import React, { useCallback, useEffect, useState } from 'react'
import CandidateLayout from '@/layouts/CandidateLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import JobCard from '@/components/JobCard'
import AIBadge from '@/components/AIBadge'
import { Briefcase, CheckSquare, Zap, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { getStoredUser } from '@/lib/auth-storage'
import ApplyCVModal from '@/components/ApplyCVModal'

type ApiJob = {
  _id: string
  title: string
  description: string
  requirements?: string[]
  location?: string
  createdAt: string
  employerId?: { email?: string } | string
}

type ApiApplication = {
  _id: string
  matchingScore: number
  status: string
  appliedAt: string
  jobId: ApiJob | string
}

function employerLabel(job: ApiJob): string {
  const e = job.employerId
  if (e && typeof e === 'object' && 'email' in e && e.email) return e.email
  return 'Employer'
}

function statusBadgeClasses(status: string) {
  if (status === 'reviewed') return 'bg-purple-50 text-purple-700'
  if (status === 'accepted') return 'bg-green-50 text-green-700'
  if (status === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-blue-50 text-blue-700'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    accepted: 'Accepted',
    rejected: 'Rejected',
  }
  return map[status] || status
}

export default function CandidateDashboardPage() {
  const [welcome, setWelcome] = useState('Candidate')
  const [openJobs, setOpenJobs] = useState<ApiJob[]>([])
  const [applications, setApplications] = useState<ApiApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [applyModal, setApplyModal] = useState<{ jobId: string; jobTitle: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const jobsRes = await apiFetch<{ data: ApiJob[] }>('/api/jobs')
      setOpenJobs(jobsRes.data || [])
    } catch {
      toast.error('Không tải danh sách việc làm (kiểm tra backend đang chạy).')
      setOpenJobs([])
    }
    try {
      const appRes = await apiFetch<{ data: ApiApplication[] }>('/api/applications/me')
      setApplications(appRes.data || [])
    } catch {
      setApplications([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const u = getStoredUser()
    if (u?.email) setWelcome(u.email.split('@')[0] || u.email)
    loadData()
  }, [loadData])

  const appliedPending = applications.filter((a) => a.status === 'pending').length
  const reviewingCount = applications.filter((a) => a.status === 'reviewed').length
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const averageMatch =
    applications.length > 0
      ? Math.round(
        applications.reduce((s, a) => s + (a.matchingScore || 0), 0) / applications.length,
      )
      : 0

  const recommendedJobs = openJobs.slice(0, 3)

  const handleApply = (jobId: string, jobTitle: string) => {
    setApplyModal({ jobId, jobTitle })
  }

  return (
    <>
    <CandidateLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Welcome, {welcome}
          </h1>
          <p className="text-foreground/70">
            You&apos;re on track to find your perfect role. Here&apos;s your activity snapshot.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Pending applications</p>
                <p className="text-3xl font-bold text-foreground">{appliedPending}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-foreground/60">Awaiting employer review</p>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Under review</p>
                <p className="text-3xl font-bold text-foreground">{reviewingCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-foreground/60">Employer reviewed</p>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Accepted</p>
                <p className="text-3xl font-bold text-foreground">{acceptedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-foreground/60">Offers / next steps</p>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Avg match</p>
                <p className="text-3xl font-bold text-foreground">
                  {applications.length ? `${averageMatch}%` : '—'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-foreground/60">From AI similarity</p>
          </Card>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Open roles (from API)
                {/* <AIBadge size="sm" /> */}
              </h2>
              <p className="text-foreground/70 mt-1">
                Jobs with status open — upload a CV first for match scoring when you apply.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/candidate/matches">View matches UI</Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-foreground/70">Loading jobs…</p>
          ) : recommendedJobs.length === 0 ? (
            <Card className="p-8 border border-border text-center text-foreground/70">
              No open jobs yet. Ask your instructor to post one from the employer account.
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {recommendedJobs.map((job) => (
                <div key={job._id} className="flex flex-col gap-3">
                  <JobCard
                    id={job._id}
                    title={job.title}
                    company={employerLabel(job)}
                    location={job.location || '—'}
                    skills={(job.requirements || []).slice(0, 8)}
                    workType="remote"
                    aiInsight="Apply to compute match score if your CV has an embedding."
                    postedDate={new Date(job.createdAt)}
                  />
                  <Button type="button" onClick={() => handleApply(job._id, job.title)}>
                    Apply now
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent applications</h2>
            <Button asChild variant="outline">
              <Link href="/candidate/applications">View all</Link>
            </Button>
          </div>

          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Job</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Company</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Match</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-foreground/70">
                        You haven&apos;t applied to any job yet.
                      </td>
                    </tr>
                  ) : (
                    applications.slice(0, 5).map((app) => {
                      const job =
                        typeof app.jobId === 'object' && app.jobId !== null ? app.jobId : null
                      return (
                        <tr
                          key={app._id}
                          className="border-b border-border hover:bg-foreground/5 transition"
                        >
                          <td className="px-6 py-4 font-medium text-foreground">
                            {job?.title || '—'}
                          </td>
                          <td className="px-6 py-4 text-foreground/70">
                            {job ? employerLabel(job) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-green-700 font-semibold">
                              {app.matchingScore ?? 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClasses(app.status)}`}
                            >
                              {statusLabel(app.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-foreground/70">
                            {app.appliedAt
                              ? new Date(app.appliedAt).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </CandidateLayout>

    {applyModal && (
      <ApplyCVModal
        jobId={applyModal.jobId}
        jobTitle={applyModal.jobTitle}
        onClose={() => setApplyModal(null)}
        onSuccess={() => { loadData(); setApplyModal(null) }}
      />
    )}
  </>
  )
}
