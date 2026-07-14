'use client'

import React, { useCallback, useEffect, useState } from 'react'
import EmployerLayout from '@/layouts/EmployerLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  FileText,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

type JobRow = { _id: string; title: string; status: string }

type Applicant = {
  _id: string
  candidateId: { _id: string; email: string } | null
  cvProfileId: {
    fullName?: string
    phone?: string
    skills?: string[]
    summary?: string
    experience?: any[]
    education?: any[]
    isLookingForJob?: boolean
    fileUrl?: string
    pdfUrl?: string
  } | null
  matchingScore: number
  status: string
  appliedAt: string
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:  { label: 'Chờ duyệt',    classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  reviewed: { label: 'Đang xem xét', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  interview:{ label: 'Phỏng vấn',    classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Chấp nhận',    classes: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Từ chối',      classes: 'bg-red-50 text-red-700 border-red-200' },
}

function matchBadgeStyle(score: number) {
  if (score >= 70) return 'bg-green-50 text-green-700 border-green-200'
  if (score >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

export default function EmployerCandidatesPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiFetch<{ data: JobRow[] }>('/api/jobs/employer/my-jobs')
        const myJobs = res.data || []
        setJobs(myJobs)
        if (myJobs.length > 0) setSelectedJobId(myJobs[0]._id)
      } catch {
        toast.error('Không tải được danh sách tin tuyển dụng')
      } finally {
        setLoadingJobs(false)
      }
    })()
  }, [])

  const loadApplicants = useCallback(async (jobId: string) => {
    if (!jobId) return
    setLoadingApplicants(true)
    setExpandedId(null)
    try {
      const res = await apiFetch<{ data: Applicant[] }>(`/api/applications/job/${jobId}`)
      setApplicants(res.data || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tải được ứng viên')
      setApplicants([])
    } finally {
      setLoadingApplicants(false)
    }
  }, [])

  useEffect(() => {
    if (selectedJobId) loadApplicants(selectedJobId)
  }, [selectedJobId, loadApplicants])

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    setUpdatingId(appId)
    try {
      await apiFetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      const labelMap: Record<string, string> = {
        reviewed: 'Đã chuyển sang Đang xem xét',
        interview: 'Đã mời phỏng vấn',
        accepted: 'Đã chấp nhận ứng viên',
        rejected: 'Đã từ chối ứng viên',
      }
      toast.success(labelMap[newStatus] || 'Cập nhật thành công')
      // Cập nhật trực tiếp trong state, không cần gọi lại API
      setApplicants((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Cập nhật thất bại')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredApplicants = (searchText.trim()
    ? applicants.filter((a) => {
        const name = a.cvProfileId?.fullName?.toLowerCase() || ''
        const email = a.candidateId?.email?.toLowerCase() || ''
        const skills = (a.cvProfileId?.skills || []).join(' ').toLowerCase()
        const q = searchText.toLowerCase()
        return name.includes(q) || email.includes(q) || skills.includes(q)
      })
    : applicants
  ).slice().sort((a, b) => (b.matchingScore ?? 0) - (a.matchingScore ?? 0))

  const selectedJob = jobs.find((j) => j._id === selectedJobId)

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Ứng viên</h1>
          <p className="text-foreground/70">
            Xem, duyệt hoặc từ chối đơn ứng tuyển — sắp xếp theo điểm khớp AI
          </p>
        </div>

        {loadingJobs ? (
          <div className="flex items-center gap-2 text-foreground/70">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải tin tuyển dụng...
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-8 border border-border text-center text-foreground/70">
            Bạn chưa có tin tuyển dụng. Hãy đăng tin trước.
          </Card>
        ) : (
          <>
            <Card className="p-4 border border-border mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Chọn tin tuyển dụng để xem ứng viên:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                    >
                      {jobs.map((job) => (
                        <option key={job._id} value={job._id}>
                          {job.title} — {job.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-foreground/50 pointer-events-none" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 sm:mt-6"
                  onClick={() => loadApplicants(selectedJobId)}
                  disabled={loadingApplicants}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingApplicants ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </Card>

            <Card className="p-4 border border-border mb-6">
              <div className="relative">
                <Search className="w-4 h-4 text-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo tên, email, kỹ năng..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </Card>

            {loadingApplicants ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-foreground/70">Đang tải ứng viên...</span>
              </div>
            ) : filteredApplicants.length === 0 ? (
              <Card className="p-8 border border-border text-center text-foreground/70">
                {applicants.length === 0
                  ? `Chưa có ứng viên nào nộp đơn vào "${selectedJob?.title || 'tin này'}".`
                  : 'Không có ứng viên phù hợp với tìm kiếm.'}
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground/70 mb-2">
                  {filteredApplicants.length} ứng viên — sắp xếp theo điểm AI giảm dần
                </p>

                {filteredApplicants.map((app, index) => {
                  const name =
                    app.cvProfileId?.fullName ||
                    app.candidateId?.email?.split('@')[0] ||
                    'Ứng viên'
                  const email = app.candidateId?.email || ''
                  const skills = app.cvProfileId?.skills || []
                  const initials = name
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  const isExpanded = expandedId === app._id
                  const isUpdating = updatingId === app._id
                  const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending

                  return (
                    <Card key={app._id} className="border border-border overflow-hidden">
                      <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <Avatar>
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            {index < 3 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-foreground">{name}</h2>
                            <p className="text-sm text-foreground/60 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {email}
                            </p>
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {skills.slice(0, 4).map((skill: string) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {skills.length > 4 && (
                                  <span className="text-xs text-foreground/50">
                                    +{skills.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                          <span
                            className={`px-3 py-1.5 rounded-full text-sm font-bold border flex items-center gap-1.5 ${matchBadgeStyle(app.matchingScore)}`}
                          >
                            ⚡ {app.matchingScore > 0 ? `${app.matchingScore}% khớp` : 'Chưa có điểm'}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.classes}`}
                          >
                            {statusCfg.label}
                          </span>

                          <span className="text-xs text-foreground/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {app.appliedAt
                              ? new Date(app.appliedAt).toLocaleDateString('vi-VN')
                              : '—'}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : app._id)
                            }
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? 'Thu gọn' : 'Xem hồ sơ'}
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-foreground/[0.02] p-5">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                Thông tin ứng viên
                              </h3>
                              <div className="space-y-2 text-sm text-foreground/80">
                                {app.cvProfileId?.phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-foreground/40" />
                                    {app.cvProfileId.phone}
                                  </p>
                                )}
                                <p className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-foreground/40" />
                                  {email}
                                </p>
                              </div>

                              {app.cvProfileId?.summary && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1">
                                    Mục tiêu
                                  </p>
                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                    {app.cvProfileId.summary}
                                  </p>
                                </div>
                              )}

                              {skills.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2">
                                    Kỹ năng
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {skills.map((skill: string) => (
                                      <span
                                        key={skill}
                                        className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/20"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              {app.cvProfileId?.experience &&
                                app.cvProfileId.experience.length > 0 && (
                                  <div className="mb-4">
                                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <Briefcase className="w-4 h-4 text-primary" />
                                      Kinh nghiệm
                                    </h3>
                                    <div className="space-y-2">
                                      {app.cvProfileId.experience.map((exp: any, i: number) => (
                                        <div
                                          key={i}
                                          className="text-sm border-l-2 border-primary/30 pl-3"
                                        >
                                          <p className="font-medium text-foreground">
                                            {exp.position || 'Xem chi tiết'}
                                          </p>
                                          {exp.company && (
                                            <p className="text-foreground/60">{exp.company}</p>
                                          )}
                                          {exp.description && (
                                            <p className="text-foreground/70 text-xs mt-1">
                                              {exp.description}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {app.cvProfileId?.education &&
                                app.cvProfileId.education.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <GraduationCap className="w-4 h-4 text-primary" />
                                      Học vấn
                                    </h3>
                                    <div className="space-y-2">
                                      {app.cvProfileId.education.map((edu: any, i: number) => (
                                        <div
                                          key={i}
                                          className="text-sm border-l-2 border-blue-300 pl-3"
                                        >
                                          <p className="font-medium text-foreground">
                                            {edu.major || edu.school || 'Xem chi tiết'}
                                          </p>
                                          {edu.school && edu.major && (
                                            <p className="text-foreground/60">{edu.school}</p>
                                          )}
                                          {edu.gpa && (
                                            <p className="text-xs text-foreground/50">
                                              GPA: {edu.gpa}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex items-center gap-3">
                              <p className="text-sm text-foreground/60">
                                Trạng thái hiện tại:{' '}
                                <span className={`font-medium ${
                                  app.status === 'accepted' ? 'text-green-600' :
                                  app.status === 'rejected' ? 'text-red-600' :
                                  app.status === 'reviewed' ? 'text-purple-600' :
                                  'text-blue-600'
                                }`}>
                                  {statusCfg.label}
                                </span>
                              </p>
                              {app.cvProfileId?.pdfUrl && (
                                <a
                                  href={app.cvProfileId.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="outline" size="sm" className="gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
                                    <FileText className="w-3.5 h-3.5" />
                                    Xem CV PDF
                                  </Button>
                                </a>
                              )}
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              {app.status !== 'reviewed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(app._id, 'reviewed')}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                  Đang xem xét
                                </Button>
                              )}

                              {app.status !== 'interview' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(app._id, 'interview')}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Phone className="w-3.5 h-3.5" />
                                  )}
                                  Phỏng vấn
                                </Button>
                              )}

                              {app.status !== 'accepted' && (
                                <Button
                                  size="sm"
                                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(app._id, 'accepted')}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  Chấp nhận
                                </Button>
                              )}

                              {app.status !== 'rejected' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  Từ chối
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </EmployerLayout>
  )
}
