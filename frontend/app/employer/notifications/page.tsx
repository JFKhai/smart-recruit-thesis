'use client'

import React, { useEffect, useState, useCallback } from 'react'
import EmployerLayout from '@/layouts/EmployerLayout'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Bell, BellOff, Trash2, CheckCheck, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type Notification = {
  _id: string
  type: string
  title: string
  body: string
  matchingScore: number | null
  jobId: { _id: string; title: string } | null
  candidateId: { _id: string; email: string } | null
  cvProfileId: { _id: string; fullName: string } | null
  applicationId: string | null
  isRead: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export default function EmployerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Notification[] }>('/api/notifications')
      setNotifications(res.data || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
    } catch {
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('Đã đánh dấu tất cả là đã đọc')
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n._id !== id))
      toast.success('Đã xóa thông báo')
    } catch {
      toast.error('Không thể xóa thông báo')
    }
  }

  const handleViewCandidate = (notif: Notification) => {
    if (notif.jobId) {
      router.push(`/employer/candidates?jobId=${notif.jobId._id}`)
    } else {
      router.push('/employer/candidates')
    }
    if (!notif.isRead) handleMarkRead(notif._id)
  }

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <EmployerLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Thông báo tuyển dụng</h1>
              <p className="text-sm text-foreground/60">
                {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground/60 hover:bg-muted/80'
              )}
            >
              {f === 'all' ? 'Tất cả' : `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <BellOff className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/50 font-medium">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(notif => (
              <div
                key={notif._id}
                className={cn(
                  'relative rounded-xl border p-4 transition-all',
                  notif.isRead
                    ? 'bg-card border-border'
                    : 'bg-primary/5 border-primary/20 shadow-sm'
                )}
              >
                {!notif.isRead && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500" />
                )}

                <div className="flex gap-3 pr-6">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    notif.matchingScore && notif.matchingScore >= 70
                      ? 'bg-green-500/15'
                      : 'bg-primary/10'
                  )}>
                    <Zap className={cn(
                      'w-4 h-4',
                      notif.matchingScore && notif.matchingScore >= 70
                        ? 'text-green-500'
                        : 'text-primary'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium text-sm leading-snug',
                      notif.isRead ? 'text-foreground/80' : 'text-foreground'
                    )}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-foreground/60 mt-0.5 leading-snug">
                        {notif.body}
                      </p>
                    )}

                    {(notif.cvProfileId?.fullName || notif.candidateId?.email) && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <User className="w-3 h-3 text-foreground/40" />
                        <span className="text-xs text-foreground/60">
                          {notif.cvProfileId?.fullName || notif.candidateId?.email}
                        </span>
                      </div>
                    )}

                    {notif.jobId?.title && (
                      <p className="text-xs text-foreground/50 mt-0.5">
                        Vị trí: <span className="font-medium text-foreground/70">{notif.jobId.title}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {notif.matchingScore != null && (
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          notif.matchingScore >= 70
                            ? 'bg-green-500/15 text-green-600'
                            : notif.matchingScore >= 50
                              ? 'bg-yellow-500/15 text-yellow-600'
                              : 'bg-muted text-foreground/50'
                        )}>
                          ⚡ {notif.matchingScore}% phù hợp
                        </span>
                      )}
                      <span className="text-xs text-foreground/40">{timeAgo(notif.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {notif.candidateId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => handleViewCandidate(notif)}
                        >
                          <User className="w-3 h-3" />
                          Xem hồ sơ ứng viên
                        </Button>
                      )}
                      {!notif.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1.5 text-foreground/60"
                          onClick={() => handleMarkRead(notif._id)}
                        >
                          <CheckCheck className="w-3 h-3" />
                          Đã đọc
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(notif._id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployerLayout>
  )
}
