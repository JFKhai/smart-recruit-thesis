'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

type Settings = {
  isEmailSubscribed: boolean
  jobMatchFrequency: string
  minMatchScore: number
}

const defaultSettings: Settings = {
  isEmailSubscribed: true,
  jobMatchFrequency: 'daily',
  minMatchScore: 70,
}

export default function EmailPreferences() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ data: { user: any; cv: any } }>('/api/users/me/profile')
        const user = res.data?.user
        setSettings((prev) => ({
          ...prev,
          isEmailSubscribed: user?.isEmailSubscribed ?? true,
          minMatchScore: user?.minMatchScore ?? 70,
          jobMatchFrequency: user?.jobMatchFrequency ?? 'daily',
        }))
      } catch {
        toast.error('Không tải được cài đặt, hiển thị mặc định')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const persist = async (next: Settings) => {
    setSaving(true)
    try {
      await apiFetch('/api/users/me/settings', {
        method: 'PUT',
        body: JSON.stringify({
          isEmailSubscribed: next.isEmailSubscribed,
          minMatchScore: next.minMatchScore,
          jobMatchFrequency: next.jobMatchFrequency,
        }),
      })
      toast.success('Đã lưu cài đặt')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-28">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="p-6 border border-border mb-8">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Nhận email gợi ý việc làm AI</h2>
            <p className="text-sm text-foreground/70 mt-1 max-w-xl">
              Tự động gợi ý việc dựa trên CV của bạn — không cần đặt bộ lọc. Muốn lọc cụ thể (từ khoá,
              địa điểm, lương...), hãy tạo Thông báo việc làm bên dưới.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={settings.isEmailSubscribed}
            onChange={() => {
              const next = { ...settings, isEmailSubscribed: !settings.isEmailSubscribed }
              setSettings(next)
              persist(next)
            }}
            className="rounded w-4 h-4"
          />
          <span className="text-sm font-medium text-foreground">
            {settings.isEmailSubscribed ? 'Bật' : 'Tắt'}
          </span>
        </label>
      </div>

      {settings.isEmailSubscribed && (
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Điểm khớp tối thiểu: {settings.minMatchScore}%
            </label>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={settings.minMatchScore}
            onChange={(e) => setSettings({ ...settings, minMatchScore: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-foreground/60">
              Chỉ nhận gợi ý khi điểm khớp AI ≥ {settings.minMatchScore}%
            </p>
            <Button size="sm" onClick={() => persist(settings)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Lưu
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
