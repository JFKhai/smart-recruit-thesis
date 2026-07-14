'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Bell, BellRing, Loader2, MapPin, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { getStoredUser } from '@/lib/auth-storage'
import { toast } from 'sonner'

type JobAlert = {
  _id: string
  keyword: string
  email: string
  location: string
  minSalary: number
  experience: string
  jobType: string
  frequency: 'daily' | 'weekly'
  isActive: boolean
  createdAt: string
}

type AlertForm = {
  keyword: string
  email: string
  location: string
  minSalary: number
  experience: string
  jobType: string
  frequency: 'daily' | 'weekly'
  agreedToTerms: boolean
}

const PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai',
  'Hải Phòng', 'Cần Thơ', 'Bắc Ninh', 'Khánh Hòa', 'Quảng Ninh',
]

const SALARY_OPTIONS = [
  { value: 0, label: 'Tất cả mức lương' },
  { value: 5, label: 'Trên 5 triệu' },
  { value: 10, label: 'Trên 10 triệu' },
  { value: 15, label: 'Trên 15 triệu' },
  { value: 20, label: 'Trên 20 triệu' },
  { value: 30, label: 'Trên 30 triệu' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: 'Tất cả kinh nghiệm' },
  { value: 'entry', label: 'Mới đi làm / Thực tập' },
  { value: 'mid', label: 'Trung cấp (1-3 năm)' },
  { value: 'senior', label: 'Senior (3-5 năm)' },
  { value: 'expert', label: 'Chuyên gia (5+ năm)' },
]

const JOBTYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại hình' },
  { value: 'onsite', label: 'Tại văn phòng' },
  { value: 'remote', label: 'Remote (từ xa)' },
  { value: 'hybrid', label: 'Hybrid (kết hợp)' },
]

const emptyForm = (email = ''): AlertForm => ({
  keyword: '',
  email,
  location: 'all',
  minSalary: 0,
  experience: 'all',
  jobType: 'all',
  frequency: 'daily',
  agreedToTerms: false,
})

const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label

export default function JobAlertsManager() {
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AlertForm>(emptyForm())

  const load = async () => {
    try {
      const res = await apiFetch<{ data: JobAlert[] }>('/api/job-alerts')
      setAlerts(res.data || [])
    } catch {
      toast.error('Không tải được danh sách thông báo việc làm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm(getStoredUser()?.email || ''))
    setOpen(true)
  }

  const openEdit = (a: JobAlert) => {
    setEditingId(a._id)
    setForm({
      keyword: a.keyword,
      email: a.email,
      location: a.location || 'all',
      minSalary: a.minSalary || 0,
      experience: a.experience || 'all',
      jobType: a.jobType || 'all',
      frequency: a.frequency,
      agreedToTerms: true, // đã đồng ý từ trước khi tạo
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.keyword.trim()) return toast.error('Vui lòng nhập từ khoá tìm kiếm')
    if (!form.email.trim()) return toast.error('Vui lòng nhập email nhận thông báo')
    if (!form.agreedToTerms) return toast.error('Bạn cần đồng ý điều khoản để tiếp tục')

    // Chuẩn hoá: 'all' -> '' để backend hiểu là không lọc
    const payload = {
      keyword: form.keyword.trim(),
      email: form.email.trim(),
      location: form.location === 'all' ? '' : form.location,
      minSalary: form.minSalary,
      experience: form.experience === 'all' ? '' : form.experience,
      jobType: form.jobType === 'all' ? '' : form.jobType,
      frequency: form.frequency,
      agreedToTerms: form.agreedToTerms,
    }

    setSaving(true)
    try {
      if (editingId) {
        await apiFetch(`/api/job-alerts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success('Đã cập nhật thông báo việc làm')
      } else {
        await apiFetch('/api/job-alerts', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Đã tạo thông báo việc làm')
      }
      setOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (a: JobAlert) => {
    // cập nhật lạc quan
    setAlerts((prev) =>
      prev.map((x) => (x._id === a._id ? { ...x, isActive: !x.isActive } : x))
    )
    try {
      await apiFetch(`/api/job-alerts/${a._id}/toggle`, { method: 'PATCH' })
    } catch {
      toast.error('Không cập nhật được trạng thái')
      load()
    }
  }

  const remove = async (a: JobAlert) => {
    if (!confirm(`Xoá thông báo việc làm "${a.keyword}"?`)) return
    try {
      await apiFetch(`/api/job-alerts/${a._id}`, { method: 'DELETE' })
      setAlerts((prev) => prev.filter((x) => x._id !== a._id))
      toast.success('Đã xoá thông báo việc làm')
    } catch {
      toast.error('Xoá thất bại')
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-5 gap-4 flex-wrap border-t border-border pt-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Thông báo việc làm của bạn</h2>
          <p className="text-foreground/70 max-w-xl mt-1">
            Tạo bộ tiêu chí để hệ thống tự gửi email khi có việc làm phù hợp (từ khoá, địa điểm, mức lương...).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Tạo mới
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="p-10 border border-dashed border-border text-center">
          <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Chưa có thông báo việc làm nào</h3>
          <p className="text-foreground/60 mt-1 mb-4">
            Tạo thông báo đầu tiên để không bỏ lỡ việc làm phù hợp với bạn.
          </p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Tạo thông báo việc làm
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((a) => (
            <Card key={a._id} className="p-5 border border-border">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BellRing className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{a.keyword}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-foreground/70">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {a.location || 'Tất cả tỉnh/thành'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        {SALARY_OPTIONS.find((s) => s.value === a.minSalary)?.label || 'Tất cả mức lương'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bell className="w-4 h-4" />
                        {a.frequency === 'weekly' ? 'Hàng tuần' : 'Hằng ngày'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {a.experience && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/70">
                          {labelOf(EXPERIENCE_OPTIONS, a.experience) || a.experience}
                        </span>
                      )}
                      {a.jobType && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/70">
                          {labelOf(JOBTYPE_OPTIONS, a.jobType) || a.jobType}
                        </span>
                      )}
                      <span className="text-xs text-foreground/50">→ {a.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-2">
                    <Switch checked={a.isActive} onCheckedChange={() => toggleActive(a)} />
                    <span className="text-xs text-foreground/60 w-8">
                      {a.isActive ? 'Bật' : 'Tắt'}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(a)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {editingId ? 'Sửa thông báo việc làm' : 'Tạo thông báo việc làm'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Từ khoá tìm kiếm <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="VD: thực tập sinh, React developer..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Email nhận thông báo <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Nhập email của bạn"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Tỉnh/Thành
                </label>
                <Select
                  value={form.location}
                  onValueChange={(v) => setForm({ ...form, location: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tỉnh/thành</SelectItem>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Mức lương
                </label>
                <Select
                  value={String(form.minSalary)}
                  onValueChange={(v) => setForm({ ...form, minSalary: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SALARY_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Kinh nghiệm
                </label>
                <Select
                  value={form.experience}
                  onValueChange={(v) => setForm({ ...form, experience: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Loại hình làm việc
                </label>
                <Select
                  value={form.jobType}
                  onValueChange={(v) => setForm({ ...form, jobType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOBTYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Tần suất nhận thông báo
              </label>
              <div className="flex gap-6">
                {(['daily', 'weekly'] as const).map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      checked={form.frequency === f}
                      onChange={() => setForm({ ...form, frequency: f })}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className="text-sm text-foreground">
                      {f === 'daily' ? 'Hằng ngày' : 'Hàng tuần'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.agreedToTerms}
                onChange={(e) => setForm({ ...form, agreedToTerms: e.target.checked })}
                className="mt-0.5 w-4 h-4"
              />
              <span className="text-sm text-foreground/80">
                Tôi đồng ý cho phép Smart Recruit thu thập và sử dụng dữ liệu cá nhân của tôi để gửi
                các email thông báo việc làm phù hợp với nhu cầu của tôi. <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
