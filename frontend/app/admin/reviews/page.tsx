'use client'

import React, { useCallback, useEffect, useState } from 'react'
import AdminLayout from '@/layouts/AdminLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/reviews/CompanyReview'
import { Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

type AdminReview = {
  _id: string
  rating: number
  comment: string
  isAnonymous: boolean
  isHidden: boolean
  employerReply: string
  createdAt: string
  companyName: string
  candidateEmail: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ data: AdminReview[] }>('/api/reviews/admin/all')
      setReviews(res.data || [])
    } catch {
      toast.error('Không tải được danh sách đánh giá')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleHide = async (r: AdminReview) => {
    setActionId(r._id)
    try {
      await apiFetch(`/api/reviews/admin/${r._id}/hide`, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden: !r.isHidden }),
      })
      setReviews((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, isHidden: !x.isHidden } : x))
      )
      toast.success(!r.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá')
    } catch {
      toast.error('Thao tác thất bại')
    } finally {
      setActionId(null)
    }
  }

  const displayed = reviews.filter((r) =>
    filter === 'all' ? true : filter === 'hidden' ? r.isHidden : !r.isHidden
  )
  const hiddenCount = reviews.filter((r) => r.isHidden).length

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Kiểm duyệt đánh giá</h1>
          <p className="text-foreground/70">
            Ẩn các đánh giá vi phạm. Tổng {reviews.length} đánh giá · {hiddenCount} đang ẩn.
          </p>
        </div>

        <div className="flex gap-2 mb-5">
          {([
            ['all', 'Tất cả'],
            ['visible', 'Đang hiển thị'],
            ['hidden', 'Đã ẩn'],
          ] as const).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground/60 hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <Card className="p-10 text-center text-foreground/50 border border-dashed border-border">
            Không có đánh giá nào.
          </Card>
        ) : (
          <div className="space-y-3">
            {displayed.map((r) => (
              <Card
                key={r._id}
                className={`p-4 border ${r.isHidden ? 'border-red-200 bg-red-50/40' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating value={r.rating} size={14} />
                      <span className="text-sm font-semibold text-foreground">{r.companyName}</span>
                      {r.isHidden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          Đã ẩn
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      Bởi: {r.isAnonymous ? `${r.candidateEmail} (ẩn danh)` : r.candidateEmail} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {r.comment && <p className="text-sm text-foreground/80 mt-2">{r.comment}</p>}
                    {r.employerReply && (
                      <p className="text-xs text-foreground/60 mt-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> NTD: {r.employerReply}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${
                      r.isHidden
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                    disabled={actionId === r._id}
                    onClick={() => toggleHide(r)}
                  >
                    {actionId === r._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : r.isHidden ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    {r.isHidden ? 'Hiện lại' : 'Ẩn'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
