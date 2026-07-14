'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import EmployerLayout from '@/layouts/EmployerLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Users, TrendingUp, Plus, Share2, Lock, Copy } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { getStoredUser } from '@/lib/auth-storage'
import { toast } from 'sonner'

type JobRow = {
  _id: string
  title: string
  location?: string
  status: string
  createdAt: string
}

export default function EmployerDashboardPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [welcome, setWelcome] = useState('Nhà tuyển dụng')
  const [stats, setStats] = useState({ totalApplications: 0, avgMatchScore: 0 })

  useEffect(() => {
    const u = getStoredUser()
    if (u?.email) setWelcome(u.email)

    let cancelled = false
    ;(async () => {
      try {
        const [jobsRes, statsRes] = await Promise.allSettled([
          apiFetch<{ data: JobRow[] }>('/api/jobs/employer/my-jobs'),
          apiFetch<{ data: { totalApplications: number; avgMatchScore: number } }>('/api/users/employer/stats'),
        ])
        if (!cancelled) {
          setJobs(jobsRes.status === 'fulfilled' ? jobsRes.value.data || [] : [])
          if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        }
      } catch {
        if (!cancelled) setJobs([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [])

  const handleCloseJob = async (jobId: string) => {
    try {
      await apiFetch(`/api/jobs/${jobId}/close`, { method: 'PATCH' })
      setJobs((prev) => prev.map((j) => j._id === jobId ? { ...j, status: 'closed' } : j))
      toast.success('Đã khóa tin tuyển dụng')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể khóa tin')
    }
  }

  const handleCloneJob = async (jobId: string) => {
    try {
      const res = await apiFetch<{ data: JobRow }>(`/api/jobs/${jobId}/clone`, { method: 'POST' })
      setJobs((prev) => [res.data, ...prev])
      toast.success('Đã tạo tin mới từ tin cũ!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể sao chép tin')
    }
  }

  const activeJobsCount = jobs.filter((j) => j.status === 'open').length

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Xin chào, {welcome}
          </h1>
          <p className="text-foreground/70">
            Quản lý tin tuyển dụng và tìm ứng viên phù hợp với AI matching
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button asChild size="lg" className="gap-2">
            <Link href="/employer/post-job">
              <Plus className="w-4 h-4" />
              Đăng tin tuyển dụng mới
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/employer/candidates">
              <Users className="w-4 h-4" />
              Xem ứng viên
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/fb-generator">
              <Share2 className="w-4 h-4" />
              Tạo bài đăng mạng xã hội
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Tin đang mở</p>
                <p className="text-3xl font-bold text-foreground">{loading ? '…' : activeJobsCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-foreground/60">Tổng {jobs.length} tin tuyển dụng</p>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Tổng đơn ứng tuyển</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? '…' : stats.totalApplications}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start -ml-2">
              <Link href="/employer/candidates">Xem danh sách ứng viên →</Link>
            </Button>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Điểm khớp AI trung bình</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? '…' : stats.totalApplications > 0 ? `${stats.avgMatchScore}%` : '—'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-foreground/60">Từ cosine similarity (Sentence-BERT)</p>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Tin tuyển dụng của bạn</h2>

          {loading ? (
            <p className="text-foreground/70">Đang tải...</p>
          ) : jobs.length === 0 ? (
            <Card className="p-8 border border-border text-center text-foreground/70">
              Chưa có tin tuyển dụng.{' '}
              <Link href="/employer/post-job" className="text-primary font-medium underline">
                Đăng tin đầu tiên
              </Link>
            </Card>
          ) : (
            <Card className="border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-foreground/5 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Tiêu đề</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Địa điểm</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Ngày đăng</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Trạng thái</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job._id} className="border-b border-border hover:bg-foreground/5 transition">
                        <td className="px-6 py-4 font-medium text-foreground">{job.title}</td>
                        <td className="px-6 py-4 text-foreground/70">{job.location || '—'}</td>
                        <td className="px-6 py-4 text-foreground/70">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              job.status === 'open'
                                ? 'bg-green-50 text-green-700'
                                : job.status === 'closed'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-orange-50 text-orange-700'
                            }`}
                          >
                            {job.status === 'open' ? 'Đang mở' : job.status === 'closed' ? 'Đã đóng' : job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => handleCloneJob(job._id)}
                              title="Tạo tin mới từ tin này"
                            >
                              <Copy className="w-3 h-3" />
                              Clone
                            </Button>
                            {job.status === 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => handleCloseJob(job._id)}
                                title="Khóa tin tuyển dụng (lưu vết)"
                              >
                                <Lock className="w-3 h-3" />
                                Khóa
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </EmployerLayout>
  )
}
