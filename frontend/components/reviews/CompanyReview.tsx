'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Star, Loader2, MessageSquare } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number
  onChange?: (v: number) => void
  size?: number
}) {
  const interactive = !!onChange
  const [hover, setHover] = useState(0)
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            className={cn(interactive ? 'cursor-pointer' : 'cursor-default')}
            aria-label={`${n} sao`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(filled ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40')}
            />
          </button>
        )
      })}
    </div>
  )
}

type MyStatus = {
  canReview: boolean
  alreadyReviewed: boolean
  myReview: { _id: string; rating: number; comment: string; isAnonymous: boolean } | null
}

export function ReviewCompanyButton({
  companyUserId,
  companyName,
  onSaved,
}: {
  companyUserId: string
  companyName?: string
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<MyStatus | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  const openModal = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const res = await apiFetch<MyStatus>(`/api/reviews/company/${companyUserId}/me`)
      setStatus(res)
      if (res.myReview) {
        setRating(res.myReview.rating)
        setComment(res.myReview.comment)
        setAnonymous(res.myReview.isAnonymous)
      } else {
        setRating(0)
        setComment('')
        setAnonymous(false)
      }
    } catch {
      toast.error('Không tải được trạng thái đánh giá')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (rating < 1) return toast.error('Vui lòng chọn số sao')
    setSaving(true)
    try {
      if (status?.myReview) {
        await apiFetch(`/api/reviews/${status.myReview._id}`, {
          method: 'PUT',
          body: JSON.stringify({ rating, comment, isAnonymous: anonymous }),
        })
        toast.success('Đã cập nhật đánh giá')
      } else {
        await apiFetch('/api/reviews', {
          method: 'POST',
          body: JSON.stringify({ companyUserId, rating, comment, isAnonymous: anonymous }),
        })
        toast.success('Cảm ơn bạn đã đánh giá!')
      }
      setOpen(false)
      onSaved?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gửi đánh giá thất bại')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!status?.myReview) return
    if (!confirm('Xoá đánh giá của bạn?')) return
    setSaving(true)
    try {
      await apiFetch(`/api/reviews/${status.myReview._id}`, { method: 'DELETE' })
      toast.success('Đã xoá đánh giá')
      setOpen(false)
      onSaved?.()
    } catch {
      toast.error('Xoá thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={openModal}>
        <Star className="w-3.5 h-3.5" />
        Đánh giá công ty
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status?.myReview ? 'Sửa đánh giá' : 'Đánh giá'} {companyName || 'công ty'}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <StarRating value={rating} onChange={setRating} size={32} />
                <span className="text-xs text-foreground/60">
                  {rating > 0 ? `${rating}/5 sao` : 'Chọn số sao'}
                </span>
              </div>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về công ty (môi trường, phỏng vấn, đãi ngộ...)"
                rows={4}
              />

              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4"
                />
                Đánh giá ẩn danh
              </label>

              <div className="flex gap-2 pt-1">
                {status?.myReview && (
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={remove}
                    disabled={saving}
                  >
                    Xoá
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={saving}>
                  Hủy
                </Button>
                <Button className="flex-1" onClick={submit} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  {status?.myReview ? 'Cập nhật' : 'Gửi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

type Review = {
  _id: string
  rating: number
  comment: string
  reviewerName: string
  employerReply: string
  employerRepliedAt: string | null
  createdAt: string
  isMine: boolean
}
type Summary = { count: number; average: number; distribution: Record<string, number> }

export function CompanyReviews({
  companyUserId,
  refreshKey = 0,
}: {
  companyUserId: string
  refreshKey?: number
}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary>({ count: 0, average: 0, distribution: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiFetch<{ data: Review[]; summary: Summary }>(
          `/api/reviews/company/${companyUserId}`
        )
        if (!active) return
        setReviews(res.data || [])
        setSummary(res.summary || { count: 0, average: 0, distribution: {} })
      } catch {
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [companyUserId, refreshKey])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{summary.average || 0}</div>
          <StarRating value={Math.round(summary.average)} size={14} />
          <div className="text-xs text-foreground/50 mt-1">{summary.count} đánh giá</div>
        </div>
      </div>

      {summary.count === 0 ? (
        <p className="text-sm text-foreground/50">Chưa có đánh giá nào cho công ty này.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size={14} />
                  <span className="text-sm font-medium text-foreground">{r.reviewerName}</span>
                  {r.isMine && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Của bạn</span>
                  )}
                </div>
                <span className="text-xs text-foreground/40">
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {r.comment && <p className="text-sm text-foreground/80 mt-1.5">{r.comment}</p>}

              {r.employerReply && (
                <div className="mt-2 ml-3 pl-3 border-l-2 border-primary/30">
                  <p className="text-xs font-medium text-primary flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Phản hồi từ công ty
                  </p>
                  <p className="text-sm text-foreground/70 mt-0.5">{r.employerReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EmployerReviewsPanel({ companyUserId }: { companyUserId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary>({ count: 0, average: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ data: Review[]; summary: Summary }>(
        `/api/reviews/company/${companyUserId}`
      )
      setReviews(res.data || [])
      setSummary(res.summary || { count: 0, average: 0, distribution: {} })
      const d: Record<string, string> = {}
      ;(res.data || []).forEach((r) => (d[r._id] = r.employerReply || ''))
      setDraft(d)
    } catch {
      toast.error('Không tải được đánh giá')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyUserId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUserId])

  const submitReply = async (id: string) => {
    const reply = (draft[id] || '').trim()
    if (!reply) return toast.error('Nhập nội dung phản hồi')
    setSavingId(id)
    try {
      await apiFetch(`/api/reviews/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply }),
      })
      toast.success('Đã gửi phản hồi')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Phản hồi thất bại')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl font-bold text-foreground">{summary.average || 0}</div>
        <div>
          <StarRating value={Math.round(summary.average)} size={16} />
          <div className="text-xs text-foreground/50 mt-0.5">{summary.count} đánh giá</div>
        </div>
      </div>

      {summary.count === 0 ? (
        <p className="text-sm text-foreground/50">Chưa có ai đánh giá công ty của bạn.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r._id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size={14} />
                  <span className="text-sm font-medium text-foreground">{r.reviewerName}</span>
                </div>
                <span className="text-xs text-foreground/40">
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {r.comment && <p className="text-sm text-foreground/80 mt-1.5">{r.comment}</p>}

              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs font-medium text-foreground/60 mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {r.employerReply ? 'Phản hồi của bạn' : 'Viết phản hồi'}
                </p>
                <Textarea
                  value={draft[r._id] ?? ''}
                  onChange={(e) => setDraft((p) => ({ ...p, [r._id]: e.target.value }))}
                  placeholder="Cảm ơn phản hồi của bạn..."
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={() => submitReply(r._id)} disabled={savingId === r._id}>
                    {savingId === r._id ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    {r.employerReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
