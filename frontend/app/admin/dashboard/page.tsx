'use client'

import React, { useCallback, useEffect, useState } from 'react'
import AdminLayout from '@/layouts/AdminLayout'
import { apiFetch } from '@/lib/api'
import { Users, Briefcase, FileText, Bell, TrendingUp, UserCheck, UserX, BarChart2 } from 'lucide-react'

type Stats = {
  users: { total: number; candidates: number; employers: number; banned: number }
  jobs: { total: number; open: number; closed: number }
  applications: { total: number }
  cvs: { total: number }
  notifications: { total: number; unread: number }
  recentUsers: Array<{ _id: string; email: string; role: string; status: string; createdAt: string }>
  recentApplications: Array<{
    _id: string
    candidateId: { email: string } | null
    jobId: { title: string } | null
    matchingScore: number
    appliedAt: string
  }>
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border bg-gray-900 border-gray-800 p-6 flex items-start gap-4 hover:border-gray-700 transition-colors`}>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    candidate: 'bg-blue-500/15 text-blue-400',
    employer: 'bg-emerald-500/15 text-emerald-400',
    admin: 'bg-violet-500/15 text-violet-400',
  }
  const label: Record<string, string> = { candidate: 'Ứng viên', employer: 'Nhà tuyển dụng', admin: 'Admin' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[role] || 'bg-gray-500/15 text-gray-400'}`}>
      {label[role] || role}
    </span>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Stats }>('/api/admin/stats')
      setStats(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-violet-400" />
            Bảng điều khiển
          </h1>
          <p className="text-gray-400">Tổng quan hệ thống Smart Recruit</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Tổng tài khoản" value={stats.users.total} sub={`${stats.users.banned} bị khoá`} color="bg-violet-600" />
              <StatCard icon={UserCheck} label="Ứng viên" value={stats.users.candidates} color="bg-blue-600" />
              <StatCard icon={TrendingUp} label="Nhà tuyển dụng" value={stats.users.employers} color="bg-emerald-600" />
              <StatCard icon={UserX} label="Tài khoản bị khoá" value={stats.users.banned} color="bg-red-600" />
              <StatCard icon={Briefcase} label="Tổng tin tuyển dụng" value={stats.jobs.total} sub={`${stats.jobs.open} đang mở`} color="bg-amber-600" />
              <StatCard icon={FileText} label="Đơn ứng tuyển" value={stats.applications.total} color="bg-cyan-600" />
              <StatCard icon={FileText} label="Hồ sơ CV" value={stats.cvs.total} color="bg-pink-600" />
              <StatCard icon={Bell} label="Thông báo" value={stats.notifications.total} sub={`${stats.notifications.unread} chưa đọc`} color="bg-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" /> Tài khoản mới nhất
                </h2>
                <div className="space-y-3">
                  {stats.recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm text-gray-200 font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {roleBadge(user.role)}
                        {user.status === 'banned' && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400">Bị khoá</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {stats.recentUsers.length === 0 && <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Đơn ứng tuyển gần đây
                </h2>
                <div className="space-y-3">
                  {stats.recentApplications.map((app) => (
                    <div key={app._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm text-gray-200 font-medium truncate">{app.jobId?.title || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{app.candidateId?.email || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${app.matchingScore >= 70 ? 'bg-green-500/15 text-green-400' : app.matchingScore >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>
                          {app.matchingScore}%
                        </span>
                        <span className="text-xs text-gray-600">{new Date(app.appliedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}
                  {stats.recentApplications.length === 0 && <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Không tải được dữ liệu thống kê.</p>
        )}
      </div>
    </AdminLayout>
  )
}
