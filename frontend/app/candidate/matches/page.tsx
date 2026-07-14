'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CandidateLayout from '@/layouts/CandidateLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, X, Loader2, RefreshCw, Briefcase, MapPin, Zap, Info, ExternalLink } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ApplyCVModal from '@/components/ApplyCVModal'

type ApiJob = {
  _id: string
  title: string
  description: string
  requirements?: string[]
  location?: string
  status: string
  createdAt: string
  expiresAt?: string
  employerId?: { email?: string } | string
  previewScore: number | null   // null = CV chưa có embedding
}

function getEmployerName(job: ApiJob): string {
  const e = job.employerId
  if (e && typeof e === 'object' && 'email' in e && e.email) return e.email
  return 'Nhà tuyển dụng'
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hôm nay'
  if (days === 1) return '1 ngày trước'
  return `${days} ngày trước`
}

function scoreBadgeStyle(score: number | null): string {
  if (score === null) return 'bg-gray-50 text-gray-400 border-gray-200'
  if (score >= 70) return 'bg-green-50 text-green-700 border-green-200'
  if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  return 'bg-red-50 text-red-600 border-red-200'
}

export default function MatchesPage() {
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [hasEmbedding, setHasEmbedding] = useState<boolean | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [applyModal, setApplyModal] = useState<{ jobId: string; jobTitle: string } | null>(null)
  const [cvInfo, setCvInfo] = useState<{ name: string | null; isPrimary: boolean } | null>(null)
  const router = useRouter()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [matchRes, appsRes] = await Promise.allSettled([
        apiFetch<{ data: ApiJob[]; hasEmbedding: boolean }>('/api/jobs/match-preview'),
        apiFetch<{ data: any[] }>('/api/applications/me'),
      ])

      if (matchRes.status === 'fulfilled') {
        setJobs(matchRes.value.data || [])
        setHasEmbedding(matchRes.value.hasEmbedding ?? false)
        setCvInfo({
          name: (matchRes.value as any).cvName || null,
          isPrimary: (matchRes.value as any).isPrimary ?? false
        })
      }

      if (appsRes.status === 'fulfilled') {
        const ids = new Set<string>(
          (appsRes.value.data || []).map((a: any) =>
            typeof a.jobId === 'object' ? a.jobId?._id : a.jobId
          )
        )
        setAppliedIds(ids)
      }
    } catch {
      toast.error('Không tải được danh sách việc làm')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredJobs = useMemo(() => {
    let result = [...jobs]
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.description || '').toLowerCase().includes(q) ||
          (j.requirements || []).some((r) => r.toLowerCase().includes(q))
      )
    }
    if (locationFilter) {
      result = result.filter((j) => j.location === locationFilter)
    }
    result.sort((a, b) => {
      if (a.previewScore === null && b.previewScore === null) return 0
      if (a.previewScore === null) return 1
      if (b.previewScore === null) return -1
      return b.previewScore - a.previewScore
    })
    return result
  }, [jobs, searchText, locationFilter])

  const uniqueLocations = [...new Set(jobs.map((j) => j.location).filter(Boolean))] as string[]

  const handleApply = (jobId: string, jobTitle: string) => {
    setApplyModal({ jobId, jobTitle })
  }

  return (
    <>
      <CandidateLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Việc làm phù hợp
              </h1>
              <p className="text-foreground/70">
                {filteredJobs.length} vị trí — điểm khớp AI hiển thị ngay, sắp xếp từ cao đến thấp
              </p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

          {hasEmbedding === false && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <span className="font-semibold">CV của bạn chưa được phân tích AI.</span>{' '}
                Hãy vào <strong>Profile &amp; CV</strong> → Upload hoặc điền thông tin CV → lưu để nhận điểm khớp AI cho từng vị trí.
              </div>
            </div>
          )}

          {/* {hasEmbedding && cvInfo?.name && (
          <div className="flex items-center gap-3 bg-green-50/60 border border-green-200/80 rounded-xl p-3.5 mb-6 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-green-600 animate-pulse" />
            </div>
            <div className="text-sm text-green-800 flex items-center gap-2 flex-wrap">
              <span>Độ phù hợp (AI) được tính dựa trên CV:</span>
              <strong className="text-green-950 font-semibold">{cvInfo.name}</strong>
              {cvInfo.isPrimary ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  CV chính
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  CV mới nhất
                </span>
              )}
            </div>
          </div>
        )} */}


          <Card className="p-6 border border-border mb-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Tìm theo tên vị trí, yêu cầu kỹ năng..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                {(searchText || locationFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { setSearchText(''); setLocationFilter(null) }}
                  >
                    <X className="w-4 h-4" /> Xóa lọc
                  </Button>
                )}
              </div>

              {uniqueLocations.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium text-foreground">Địa điểm:</span>
                  {uniqueLocations.slice(0, 6).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocationFilter(locationFilter === loc ? null : loc)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${locationFilter === loc
                        ? 'bg-primary text-white'
                        : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                        }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-foreground/70">Đang tính điểm AI & tải việc làm...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="p-12 border border-border text-center">
              <p className="text-lg text-foreground/70 mb-4">
                {jobs.length === 0
                  ? 'Chưa có tin tuyển dụng nào.'
                  : 'Không có việc làm phù hợp với bộ lọc hiện tại.'}
              </p>
              <Button variant="outline" onClick={() => { setSearchText(''); setLocationFilter(null) }}>
                Xóa bộ lọc
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredJobs.map((job, index) => {
                const isApplied = appliedIds.has(job._id)
                const score = job.previewScore

                return (
                  <Card
                    key={job._id}
                    className="p-6 border border-border hover:shadow-md transition-shadow relative"
                  >
                    {score !== null && index < 3 && (
                      <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shadow">
                        #{index + 1}
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <button
                          className="text-left hover:text-primary transition-colors w-full"
                          onClick={() => router.push(`/candidate/jobs/${job._id}`)}
                        >
                          <h3 className="font-bold text-foreground text-lg leading-snug truncate hover:text-primary">{job.title}</h3>
                        </button>
                        <p className="text-sm text-foreground/60 mt-0.5">{getEmployerName(job)}</p>
                      </div>

                      <div className="ml-2 flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${scoreBadgeStyle(score)}`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {score !== null ? `${score}% khớp` : 'Chưa có điểm'}
                        </span>
                        {isApplied && (
                          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 text-xs">
                            ✓ Đã ứng tuyển
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mb-4">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {daysSince(job.createdAt)}
                      </span>
                      {job.expiresAt && (
                        <span className="text-orange-600 text-xs">
                          Hết hạn: {new Date(job.expiresAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-foreground/70 line-clamp-2 mb-4">
                      {job.description}
                    </p>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.requirements.slice(0, 5).map((req, i) => (
                          <span key={`${req}-${i}`} className="px-2 py-1 rounded-md text-xs bg-foreground/5 text-foreground/70">
                            {req}
                          </span>
                        ))}
                        {job.requirements.length > 5 && (
                          <span className="px-2 py-1 rounded-md text-xs text-foreground/50">
                            +{job.requirements.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-1.5"
                        onClick={() => router.push(`/candidate/jobs/${job._id}`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Xem chi tiết
                      </Button>
                      <Button
                        className="flex-1"
                        variant={isApplied ? 'outline' : 'default'}
                        disabled={isApplied}
                        onClick={() => !isApplied && handleApply(job._id, job.title)}
                      >
                        {isApplied ? '✓ Đã ứng tuyển' : 'Ứng tuyển ngay'}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </CandidateLayout>

      {applyModal && (
        <ApplyCVModal
          jobId={applyModal.jobId}
          jobTitle={applyModal.jobTitle}
          onClose={() => setApplyModal(null)}
          onSuccess={(jid) => setAppliedIds((prev) => new Set([...prev, jid]))}
        />
      )}
    </>
  )
}
