'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import CandidateLayout from '@/layouts/CandidateLayout'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  Bell,
  BellOff,
  Trash2,
  ExternalLink,
  CheckCheck,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Notification = {
  _id: string
  type: string
  title: string
  body: string
  matchingScore: number | null
  jobId: { _id: string; title: string; location?: string } | null
  cvProfileId: { _id: string; fullName: string } | null
  isRead: boolean
  createdAt: string
}

type Group = {
  key: string
  job: { _id: string; title: string; location?: string } | null
  items: Notification[]
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

function scoreClass(score: number) {
  if (score >= 70) return 'bg-green-500/15 text-green-600'
  if (score >= 50) return 'bg-yellow-500/15 text-yellow-600'
  return 'bg-muted text-foreground/50'
}

/** Gộp các thông báo cùng một job thành 1 nhóm. Thông báo không gắn job thì đứng riêng. */
function groupByJob(list: Notification[]): Group[] {
  const groups: Group[] = []
  const indexByKey = new Map<string, number>()
  for (const n of list) {
    const key = n.jobId?._id ? `job-${n.jobId._id}` : `single-${n._id}`
    const existing = indexByKey.get(key)
    if (existing === undefined) {
      indexByKey.set(key, groups.length)
      groups.push({ key, job: n.jobId, items: [n] })
    } else {
      groups[existing].items.push(n)
    }
  }
  return groups
}

export default function CandidateNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)))
    } catch {
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const handleMarkGroupRead = async (items: Notification[]) => {
    const unread = items.filter((n) => !n.isRead)
    if (unread.length === 0) return
    await Promise.allSettled(unread.map((n) => handleMarkRead(n._id)))
  }

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success('Đã đánh dấu tất cả là đã đọc')
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      toast.success('Đã xóa thông báo')
    } catch {
      toast.error('Không thể xóa thông báo')
    }
  }

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length
  const groups = groupByJob(displayed)

  /** Một dòng thông báo (dùng cho cả thẻ đơn lẫn item trong nhóm). */
  const NotifRow = ({ notif, nested }: { notif: Notification; nested?: boolean }) => (
    <div className={cn(nested && 'pt-3 mt-3 border-t border-border/60')}>
      <p
        className={cn(
          'font-medium text-sm leading-snug',
          notif.isRead ? 'text-foreground/80' : 'text-foreground'
        )}
      >
        {notif.title}
      </p>
      {notif.body && (
        <p className="text-xs text-foreground/60 mt-0.5 leading-snug">{notif.body}</p>
      )}
      {notif.cvProfileId?.fullName && (
        <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40" />
          Dựa trên CV:{' '}
          <span className="font-semibold text-foreground/75">{notif.cvProfileId.fullName}</span>
        </p>
      )}

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {notif.matchingScore != null && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              scoreClass(notif.matchingScore)
            )}
          >
            ⚡ {notif.matchingScore}% phù hợp
          </span>
        )}
        <span className="text-xs text-foreground/40">{timeAgo(notif.createdAt)}</span>
        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-red-500" />}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {!notif.isRead && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1.5 text-foreground/60"
            onClick={() => handleMarkRead(notif._id)}
          >
            <CheckCheck className="w-3 h-3" />
            Đánh dấu đã đọc
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
  )

  return (
    <CandidateLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
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
          {(['all', 'unread'] as const).map((f) => (
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <BellOff className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/50 font-medium">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const groupUnread = group.items.some((n) => !n.isRead)
              const isGroup = group.items.length > 1
              const latest = group.items[0]

              // Thẻ đơn (1 thông báo) — giữ giao diện như cũ
              if (!isGroup) {
                return (
                  <div
                    key={group.key}
                    className={cn(
                      'relative rounded-xl border p-4 transition-all',
                      latest.isRead ? 'bg-card border-border' : 'bg-primary/5 border-primary/20 shadow-sm'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          latest.matchingScore && latest.matchingScore >= 70
                            ? 'bg-green-500/15'
                            : 'bg-primary/10'
                        )}
                      >
                        <Zap
                          className={cn(
                            'w-4 h-4',
                            latest.matchingScore && latest.matchingScore >= 70
                              ? 'text-green-500'
                              : 'text-primary'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <NotifRow notif={latest} />
                        {latest.jobId && (
                          <Link href={`/candidate/jobs/${latest.jobId._id}`} className="inline-block mt-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                              <ExternalLink className="w-3 h-3" />
                              Xem chi tiết job
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              // Thẻ nhóm (nhiều thông báo cùng 1 job)
              const isOpen = expanded.has(group.key)
              const visibleItems = isOpen ? group.items : group.items.slice(0, 1)
              return (
                <div
                  key={group.key}
                  className={cn(
                    'rounded-xl border transition-all overflow-hidden',
                    groupUnread ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">
                          {group.job?.title || 'Thông báo'}
                        </p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {group.items.length} cập nhật
                        </span>
                        {groupUnread && <span className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>
                      {group.job?.location && (
                        <p className="text-xs text-foreground/50 mt-0.5">{group.job.location}</p>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {group.job && (
                          <Link href={`/candidate/jobs/${group.job._id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                              <ExternalLink className="w-3 h-3" />
                              Xem chi tiết job
                            </Button>
                          </Link>
                        )}
                        {groupUnread && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1.5 text-foreground/60"
                            onClick={() => handleMarkGroupRead(group.items)}
                          >
                            <CheckCheck className="w-3 h-3" />
                            Đánh dấu nhóm đã đọc
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1.5 text-foreground/60"
                          onClick={() => toggleExpand(group.key)}
                        >
                          <ChevronDown
                            className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')}
                          />
                          {isOpen ? 'Thu gọn' : `Xem ${group.items.length - 1} thông báo khác`}
                        </Button>
                      </div>

                      <div className="mt-1">
                        {visibleItems.map((n, idx) => (
                          <NotifRow key={n._id} notif={n} nested={idx > 0} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CandidateLayout>
  )
}
