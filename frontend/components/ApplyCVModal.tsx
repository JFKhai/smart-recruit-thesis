'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { Loader2, FileText, Star, CheckCircle, AlertCircle, X, Zap, Upload } from 'lucide-react'
import { toast } from 'sonner'

type CvSummary = {
  _id: string
  fullName: string
  headline?: string
  skills?: string[]
  isPrimary: boolean
  isLookingForJob: boolean
  fileUrl?: string
  embedding?: number[]
  createdAt: string
}

type Props = {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess: (jobId: string) => void
}

export default function ApplyCVModal({ jobId, jobTitle, onClose, onSuccess }: Props) {
  const [cvList, setCvList] = useState<CvSummary[]>([])
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ data: CvSummary[] }>('/api/cv')
        const list = res.data || []
        setCvList(list)
        // Pre-select: CV primary trước, nếu không thì CV mới nhất
        const primary = list.find((c) => c.isPrimary)
        const first = list[0]
        setSelectedCvId(primary?._id || first?._id || null)
      } catch {
        toast.error('Không tải được danh sách CV')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleApply = async () => {
    if (!selectedCvId) {
      toast.error('Vui lòng chọn CV để ứng tuyển')
      return
    }
    setApplying(true)
    try {
      await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, cvProfileId: selectedCvId }),
      })
      toast.success('Đã gửi đơn ứng tuyển thành công!')
      onSuccess(jobId)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể ứng tuyển')
    } finally {
      setApplying(false)
    }
  }

  const hasEmbedding = (cv: CvSummary) => cv.embedding && cv.embedding.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        
        <div className="relative px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Chọn CV để ứng tuyển</h2>
              <p className="text-sm text-foreground/60 truncate max-w-xs">{jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 gap-2 text-foreground/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải danh sách CV...</span>
            </div>
          ) : cvList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">Bạn chưa có CV nào</p>
                <p className="text-sm text-foreground/60 mt-1">
                  Hãy tạo CV trong trang <strong>Hồ sơ & CV</strong> trước khi ứng tuyển.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground/60 mb-1">
                Điểm khớp AI sẽ được tính lại theo CV bạn chọn.
              </p>
              {cvList.map((cv) => {
                const isSelected = selectedCvId === cv._id
                const hasEmb = hasEmbedding(cv)
                return (
                  <button
                    key={cv._id}
                    type="button"
                    onClick={() => setSelectedCvId(cv._id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-foreground/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">{cv.fullName}</span>
                            {cv.isPrimary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                                <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                                CV chính
                              </span>
                            )}
                          </div>
                          {cv.headline && (
                            <p className="text-sm text-foreground/60 mt-0.5 truncate">{cv.headline}</p>
                          )}
                          {cv.skills && cv.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {cv.skills.slice(0, 4).map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded text-xs bg-foreground/5 border border-border text-foreground/70">
                                  {s}
                                </span>
                              ))}
                              {cv.skills.length > 4 && (
                                <span className="text-xs text-foreground/40">+{cv.skills.length - 4}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {hasEmb ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <Zap className="w-3 h-3" /> AI embedding sẵn sàng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <AlertCircle className="w-3 h-3" /> Chưa có AI embedding
                              </span>
                            )}
                            {cv.fileUrl && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                <FileText className="w-3 h-3" /> Có file PDF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground/40 mt-1">
                            Tạo {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-foreground/[0.01] flex items-center justify-between gap-3">
          <a href="/candidate/cv" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Quản lý CV
          </a>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={applying}>
              Hủy
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying || loading || cvList.length === 0 || !selectedCvId}
              className="gap-2 min-w-[130px]"
            >
              {applying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Xác nhận ứng tuyển</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
