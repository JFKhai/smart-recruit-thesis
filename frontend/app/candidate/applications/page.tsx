'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import CandidateLayout from '@/layouts/CandidateLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Loader2, RefreshCw, X, MapPin, Briefcase } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { ReviewCompanyButton } from '@/components/reviews/CompanyReview'

type ApiJob = {
  _id: string
  title: string
  description?: string
  location?: string
  requirements?: string[]
  salary?: string
  jobType?: string
  experience?: string
  employerId?: { _id?: string; email?: string } | string
}

type Application = {
  _id: string
  jobId: ApiJob | string | null
  matchingScore: number
  status: string
  appliedAt: string
}

function getJob(app: Application): ApiJob | null {
  if (typeof app.jobId === 'object' && app.jobId !== null) return app.jobId
  return null
}

function getJobId(app: Application): string {
  const j = getJob(app)
  return j ? j._id : typeof app.jobId === 'string' ? app.jobId : ''
}

function getJobTitle(app: Application): string {
  return getJob(app)?.title || '—'
}

function getEmployerEmail(app: Application): string {
  const e = getJob(app)?.employerId
  if (e && typeof e === 'object' && 'email' in e) return e.email || 'Nhà tuyển dụng'
  return 'Nhà tuyển dụng'
}

function getEmployerId(app: Application): string {
  const e = getJob(app)?.employerId
  if (e && typeof e === 'object' && '_id' in e) return e._id || ''
  return typeof e === 'string' ? e : ''
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Chờ duyệt',
    reviewed: 'Đang xem xét',
    interview: 'Phỏng vấn',
    accepted: 'Chấp nhận',
    rejected: 'Từ chối',
  }
  return map[status] || status
}

function statusClasses(status: string) {
  if (status === 'reviewed') return 'bg-purple-50 text-purple-700'
  if (status === 'interview') return 'bg-amber-50 text-amber-700'
  if (status === 'accepted') return 'bg-green-50 text-green-700'
  if (status === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-blue-50 text-blue-700'
}

function matchColor(score: number) {
  if (score >= 70) return 'text-green-700 font-semibold'
  if (score >= 40) return 'text-yellow-700 font-semibold'
  return 'text-foreground/50'
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const loadApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ data: Application[] }>('/api/applications/me')
      setApplications(res.data || [])
    } catch {
      toast.error('Không tải được danh sách đơn ứng tuyển')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadApplications() }, [loadApplications])

  const handleCancelApplication = async (appId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn ứng tuyển này?')) return
    try {
      await apiFetch(`/api/applications/${appId}`, { method: 'DELETE' })
      toast.success('Đã hủy đơn ứng tuyển thành công')
      loadApplications()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể hủy đơn ứng tuyển')
    }
  }

  const byStatus = (status: string) => applications.filter((a) => a.status === status)
  const statusList = ['pending', 'reviewed', 'interview', 'accepted', 'rejected']

  const AppTable = ({ apps }: { apps: Application[] }) => (
    <Card className="border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-foreground/5 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Vị trí & Công ty</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Điểm AI</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Trạng thái</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Ngày nộp</th>
              <th className="px-6 py-4 text-right font-semibold text-foreground">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-foreground/70">
                  Chưa có đơn ứng tuyển trong mục này.
                </td>
              </tr>
            ) : (
              apps.map((app) => (
                <tr key={app._id} className="border-b border-border hover:bg-foreground/5 transition">
                  <td className="px-6 py-4">
                    <Link
                      href={`/candidate/jobs/${getJobId(app)}`}
                      className="text-left group block"
                    >
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors underline-offset-2 group-hover:underline">
                        {getJobTitle(app)}
                      </p>
                      <p className="text-xs text-foreground/60 mt-0.5">{getEmployerEmail(app)}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={matchColor(app.matchingScore || 0)}>
                      {app.matchingScore ? `${app.matchingScore}%` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(app.status)}`}>
                      {statusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground/70">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('vi-VN') : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {['reviewed', 'interview', 'accepted'].includes(app.status) && getEmployerId(app) && (
                        <ReviewCompanyButton
                          companyUserId={getEmployerId(app)}
                          companyName={getEmployerEmail(app)}
                        />
                      )}
                      {['pending', 'reviewed'].includes(app.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 text-xs h-8"
                          onClick={() => handleCancelApplication(app._id)}
                        >
                          Hủy đơn
                        </Button>
                      )}
                      {app.status === 'rejected' && (
                        <span className="text-xs text-foreground/40">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )

  return (
    <CandidateLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Theo dõi đơn ứng tuyển
            </h1>
            <p className="text-foreground/70">
              Xem trạng thái tất cả đơn ứng tuyển và điểm khớp AI
            </p>
          </div>
          <Button variant="outline" onClick={loadApplications} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/70">Đang tải đơn ứng tuyển...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                <p className="text-xs text-foreground/70 mt-1">Tổng đơn</p>
              </Card>
              <Card className="p-4 border border-border text-center">
                <p className="text-2xl font-bold text-blue-600">{byStatus('pending').length}</p>
                <p className="text-xs text-foreground/70 mt-1">Chờ duyệt</p>
              </Card>
              <Card className="p-4 border border-border text-center">
                <p className="text-2xl font-bold text-purple-600">{byStatus('reviewed').length}</p>
                <p className="text-xs text-foreground/70 mt-1">Đang xem xét</p>
              </Card>
              <Card className="p-4 border border-border text-center">
                <p className="text-2xl font-bold text-green-600">{byStatus('accepted').length}</p>
                <p className="text-xs text-foreground/70 mt-1">Chấp nhận</p>
              </Card>
            </div>

            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
                <TabsTrigger value="all">Tất cả ({applications.length})</TabsTrigger>
                <TabsTrigger value="pending">Chờ ({byStatus('pending').length})</TabsTrigger>
                <TabsTrigger value="reviewed">Xem xét ({byStatus('reviewed').length})</TabsTrigger>
                <TabsTrigger value="interview">Phỏng vấn ({byStatus('interview').length})</TabsTrigger>
                <TabsTrigger value="accepted">Chấp nhận ({byStatus('accepted').length})</TabsTrigger>
                <TabsTrigger value="rejected">Từ chối ({byStatus('rejected').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <AppTable apps={applications} />
              </TabsContent>
              {statusList.map((status) => (
                <TabsContent key={status} value={status} className="mt-6">
                  <AppTable apps={byStatus(status)} />
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>

    </CandidateLayout>
  )
}
