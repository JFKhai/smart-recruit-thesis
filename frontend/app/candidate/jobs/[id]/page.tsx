'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CandidateLayout from '@/layouts/CandidateLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MapPin, Calendar, Briefcase, DollarSign, Star, Users, Globe,
  Building2, Loader2, ArrowLeft, Zap, Clock, CheckCircle,
  Award, TrendingUp
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import ApplyCVModal from '@/components/ApplyCVModal'
import { CompanyReviews } from '@/components/reviews/CompanyReview'

type Job = {
  _id: string
  title: string
  description: string
  requirements: string[]
  location: string
  salary: string
  jobType: string
  experience: string
  level: string
  industry: string
  benefits: string[]
  expiresAt: string
  createdAt: string
  updatedAt: string
  employerId: { _id: string; email: string }
  previewScore?: number | null
}

type CompanyProfile = {
  companyName: string
  about: string
  industry: string
  size: string
  website: string
  address: string
  foundedYear: number
  benefits: string[]
}

type OtherJob = {
  _id: string
  title: string
  location: string
  salary: string
  expiresAt: string
  createdAt: string
}

const sizeLabels: Record<string, string> = {
  startup: 'Startup (1 – 50)',
  small: 'Nhỏ (51 – 200)',
  medium: 'Vừa (201 – 1.000)',
  large: 'Lớn (1.000+)',
}

const industryLabels: Record<string, string> = {
  technology: 'Công nghệ thông tin',
  finance: 'Tài chính / Ngân hàng',
  healthcare: 'Y tế / Dược phẩm',
  consulting: 'Tư vấn / Dịch vụ',
  logistics: 'Logistics / Vận tải',
  education: 'Giáo dục / Đào tạo',
  marketing: 'Marketing / Truyền thông',
  manufacturing: 'Sản xuất / Chế tạo',
  other: 'Khác',
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hôm nay'
  if (days === 1) return '1 ngày trước'
  return `${days} ngày trước`
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [otherJobs, setOtherJobs] = useState<OtherJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'detail' | 'company'>('detail')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  useEffect(() => {
    if (!jobId) return
    const load = async () => {
      setLoading(true)
      try {
        const [jobRes, appsRes] = await Promise.allSettled([
          apiFetch<{ data: Job; companyProfile: CompanyProfile | null; otherJobs: OtherJob[] }>(`/api/jobs/${jobId}`),
          apiFetch<{ data: any[] }>('/api/applications/me'),
        ])
        if (jobRes.status === 'fulfilled') {
          setJob(jobRes.value.data)
          setCompany(jobRes.value.companyProfile)
          setOtherJobs(jobRes.value.otherJobs || [])
        }
        if (appsRes.status === 'fulfilled') {
          const ids = (appsRes.value.data || []).map((a: any) =>
            typeof a.jobId === 'object' ? a.jobId?._id : a.jobId
          )
          setApplied(ids.includes(jobId))
        }
      } catch {
        toast.error('Không tải được thông tin công việc')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [jobId])

  const handleApply = () => {
    setShowApplyModal(true)
  }

  if (loading) {
    return (
      <CandidateLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-foreground/70">Đang tải thông tin...</span>
        </div>
      </CandidateLayout>
    )
  }

  if (!job) {
    return (
      <CandidateLayout>
        <div className="p-8 text-center">
          <p className="text-foreground/70 mb-4">Không tìm thấy tin tuyển dụng này.</p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
      </CandidateLayout>
    )
  }

  const companyName = company?.companyName || job.employerId?.email?.split('@')[0] || 'Nhà tuyển dụng'

  return (
    <>
    <CandidateLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <Button variant="ghost" className="mb-4 gap-2 text-foreground/70" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>

        <Card className="p-6 border border-border mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border">
              <span className="text-2xl font-bold text-primary">
                {companyName.substring(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-1">{job.title}</h1>
              <p className="text-foreground/60 text-sm mb-3">{companyName}</p>

              <div className="flex flex-wrap gap-3 text-sm text-foreground/70 mb-3">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary/70" />
                  {daysSince(job.updatedAt || job.createdAt)}
                </span>
                {job.expiresAt && (
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <Calendar className="w-4 h-4" />
                    Hết hạn: {fmtDate(job.expiresAt)}
                  </span>
                )}
              </div>

              {job.previewScore !== undefined && job.previewScore !== null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                  <Zap className="w-4 h-4" />
                  {job.previewScore}% phù hợp với CV của bạn
                </span>
              )}
            </div>

            <div className="sm:ml-auto flex-shrink-0">
              <Button
                size="lg"
                disabled={applied || applying}
                variant={applied ? 'outline' : 'default'}
                onClick={handleApply}
                className="gap-2 min-w-[160px]"
              >
                {applying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Đang nộp...</>
                ) : applied ? (
                  <><CheckCircle className="w-4 h-4" />Đã ứng tuyển</>
                ) : (
                  'Ứng tuyển ngay'
                )}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-0 mb-6 border-b border-border">
          {(['detail', 'company'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              {tab === 'detail' ? 'Chi tiết' : 'Tổng quan công ty'}
            </button>
          ))}
        </div>

        {activeTab === 'detail' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 border border-border">
                <h2 className="text-base font-semibold text-foreground mb-4">Thông tin chung</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem icon={<MapPin className="w-4 h-4 text-primary" />} label="Địa điểm" value={job.location || '—'} />
                  <InfoItem icon={<Calendar className="w-4 h-4 text-primary" />} label="Ngày cập nhật" value={fmtDate(job.updatedAt)} />
                  <InfoItem icon={<DollarSign className="w-4 h-4 text-primary" />} label="Lương" value={job.salary || 'Thỏa thuận'} />
                  <InfoItem icon={<Briefcase className="w-4 h-4 text-primary" />} label="Ngành nghề" value={job.industry || industryLabels[company?.industry || ''] || '—'} />
                  <InfoItem icon={<Building2 className="w-4 h-4 text-primary" />} label="Hình thức" value={job.jobType || '—'} />
                  <InfoItem icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Kinh nghiệm" value={job.experience || '—'} />
                  <InfoItem icon={<Award className="w-4 h-4 text-primary" />} label="Cấp bậc" value={job.level || '—'} />
                  <InfoItem icon={<Calendar className="w-4 h-4 text-orange-500" />} label="Hết hạn nộp" value={fmtDate(job.expiresAt)} highlight={!!job.expiresAt} />
                </div>
              </Card>

              {((job.benefits?.length || 0) > 0 || (company?.benefits?.length || 0) > 0) && (
                <Card className="p-6 border border-border">
                  <h2 className="text-base font-semibold text-foreground mb-4">Phúc lợi</h2>
                  <div className="flex flex-wrap gap-2">
                    {((job.benefits?.length || 0) > 0 ? job.benefits : company?.benefits || []).map((b) => (
                      <Badge key={b} variant="secondary" className="px-3 py-1.5 text-sm">{b}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6 border border-border">
                <h2 className="text-base font-semibold text-foreground mb-4">Mô tả công việc</h2>
                <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </div>
              </Card>

              {job.requirements?.length > 0 && (
                <Card className="p-6 border border-border">
                  <h2 className="text-base font-semibold text-foreground mb-4">Yêu cầu công việc</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  size="lg"
                  disabled={applied || applying}
                  variant={applied ? 'outline' : 'default'}
                  onClick={handleApply}
                  className="gap-2 min-w-[200px]"
                >
                  {applying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Đang nộp...</>
                  ) : applied ? (
                    <><CheckCircle className="w-4 h-4" />Đã ứng tuyển</>
                  ) : (
                    'Nộp đơn ứng tuyển'
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {otherJobs.length > 0 && (
                <Card className="p-5 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Việc làm khác của công ty</h3>
                  <div className="space-y-3">
                    {otherJobs.map((j) => (
                      <button
                        key={j._id}
                        onClick={() => router.push(`/candidate/jobs/${j._id}`)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition"
                      >
                        <p className="text-sm font-medium text-foreground line-clamp-2">{j.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-foreground/60">
                          {j.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>}
                          {j.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{j.salary}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-6">
              <Card className="p-6 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-border flex-shrink-0">
                    <span className="text-2xl font-bold text-primary">
                      {companyName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{companyName}</h2>
                    {company?.industry && (
                      <p className="text-sm text-foreground/60">{industryLabels[company.industry] || company.industry}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {company?.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground/50 text-xs mb-0.5">Địa chỉ</p>
                        <p className="text-foreground">{company.address}</p>
                      </div>
                    </div>
                  )}
                  {company?.size && (
                    <div className="flex items-start gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground/50 text-xs mb-0.5">Quy mô</p>
                        <p className="text-foreground">{sizeLabels[company.size] || company.size}</p>
                      </div>
                    </div>
                  )}
                  {company?.foundedYear && (
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground/50 text-xs mb-0.5">Năm thành lập</p>
                        <p className="text-foreground">{company.foundedYear}</p>
                      </div>
                    </div>
                  )}
                  {company?.website && (
                    <div className="flex items-start gap-2 text-sm">
                      <Globe className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground/50 text-xs mb-0.5">Website</p>
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {company?.about && (
                  <>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Giới thiệu về công ty</h3>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{company.about}</p>
                  </>
                )}

                {!company && (
                  <p className="text-sm text-foreground/50 text-center py-4">Công ty chưa cập nhật hồ sơ.</p>
                )}
              </Card>

              {job.employerId?._id && (
                <Card className="p-6 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Đánh giá công ty</h3>
                  <CompanyReviews companyUserId={job.employerId._id} />
                </Card>
              )}

              {company?.benefits && company.benefits.length > 0 && (
                <Card className="p-6 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Phúc lợi & Quyền lợi</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.benefits.map((b) => (
                      <Badge key={b} variant="secondary" className="px-3 py-1.5 text-sm">{b}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              {otherJobs.length > 0 && (
                <Card className="p-6 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Việc làm đang tuyển</h3>
                  <div className="space-y-3">
                    {otherJobs.map((j) => (
                      <button
                        key={j._id}
                        onClick={() => router.push(`/candidate/jobs/${j._id}`)}
                        className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition"
                      >
                        <p className="text-sm font-semibold text-foreground mb-1">{j.title}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                          {j.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>}
                          {j.salary && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{j.salary}</span>}
                          {j.expiresAt && <span className="text-orange-500">Hết hạn: {fmtDate(j.expiresAt)}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
          </div>
        )}
      </div>
    </CandidateLayout>

    {showApplyModal && job && (
      <ApplyCVModal
        jobId={jobId}
        jobTitle={job.title}
        onClose={() => setShowApplyModal(false)}
        onSuccess={() => setApplied(true)}
      />
    )}
  </>
  )
}

function InfoItem({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-foreground/50">{icon}{label}</div>
      <p className={`text-sm font-medium ${highlight ? 'text-orange-600' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}
