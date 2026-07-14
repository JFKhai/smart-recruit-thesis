'use client'

import React, { useCallback, useEffect, useState } from 'react'
import AdminLayout from '@/layouts/AdminLayout'
import { apiFetch } from '@/lib/api'
import { Server, RefreshCw, CheckCircle, XCircle, Cpu, Database, Zap, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SystemInfo = {
  server: {
    uptime: string
    uptimeSeconds: number
    nodeEnv: string
    nodeVersion: string
    platform: string
    memoryUsageMB: number
  }
  database: {
    status: string
    readyState: number
    host: string
    name: string
  }
  services: {
    aiServiceUrl: string
    cronSchedule: string
  }
  notifications: {
    total: number
    softDeleted: number
  }
  cvs: {
    withEmbedding: number
  }
}

function InfoRow({ label, value, badge }: { label: string; value: string | number; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        {badge}
        <span className="text-sm text-gray-100 font-medium">{value}</span>
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Icon className={cn('w-4 h-4', color)} />
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function AdminSystemPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ data: SystemInfo }>('/api/admin/system')
      setInfo(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const dbConnected = info?.database.readyState === 1

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <Server className="w-7 h-7 text-cyan-400" /> Tác vụ Hệ thống
            </h1>
            <p className="text-gray-400">Trạng thái và thông tin hoạt động của server</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2 border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Làm mới
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-56 bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : info ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard icon={Cpu} title="Thông tin Server" color="text-cyan-400">
              <InfoRow label="Uptime" value={info.server.uptime} />
              <InfoRow label="Môi trường" value={info.server.nodeEnv} />
              <InfoRow label="Node.js" value={info.server.nodeVersion} />
              <InfoRow label="Platform" value={info.server.platform} />
              <InfoRow
                label="Bộ nhớ sử dụng"
                value={`${info.server.memoryUsageMB} MB`}
                badge={
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    info.server.memoryUsageMB > 300
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-green-500/15 text-green-400'
                  )}>
                    {info.server.memoryUsageMB > 300 ? 'Cao' : 'Bình thường'}
                  </span>
                }
              />
            </SectionCard>

            <SectionCard icon={Database} title="Cơ sở dữ liệu" color="text-emerald-400">
              <InfoRow
                label="Kết nối MongoDB"
                value={info.database.status}
                badge={
                  dbConnected
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                }
              />
              <InfoRow label="Host" value={info.database.host || '—'} />
              <InfoRow label="Database" value={info.database.name || '—'} />
            </SectionCard>

            <SectionCard icon={Zap} title="Dịch vụ tích hợp" color="text-violet-400">
              <InfoRow
                label="AI Service URL"
                value={info.services.aiServiceUrl}
                badge={
                  info.services.aiServiceUrl !== '(Chưa cấu hình)'
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-amber-400" />
                }
              />
              <div className="py-3 border-b border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-gray-400">Cron Job</span>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      Đang chạy
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{info.services.cronSchedule}</p>
                  </div>
                </div>
              </div>
              <InfoRow label="CV có AI Embedding" value={info.cvs.withEmbedding} />
            </SectionCard>

            <SectionCard icon={Bell} title="Thông báo hệ thống" color="text-amber-400">
              <InfoRow label="Tổng thông báo" value={info.notifications.total} />
              <InfoRow
                label="Đã xóa mềm (soft-deleted)"
                value={info.notifications.softDeleted}
                badge={
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-400">Ẩn khỏi UI</span>
                }
              />
              <InfoRow
                label="Thông báo hiển thị"
                value={info.notifications.total - info.notifications.softDeleted}
              />
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400">
                  💡 Hệ thống dùng <strong className="text-gray-200">Soft-Delete</strong> — thông báo bị xóa được đánh dấu <code className="bg-gray-700 px-1 rounded text-violet-300">isDeleted: true</code>, không bị xóa khỏi DB để tránh cron job tạo lại.
                </p>
              </div>
            </SectionCard>
          </div>
        ) : (
          <p className="text-gray-500">Không tải được thông tin hệ thống.</p>
        )}
      </div>
    </AdminLayout>
  )
}
