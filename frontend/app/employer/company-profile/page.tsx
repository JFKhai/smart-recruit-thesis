'use client'

import React, { useEffect, useState } from 'react'
import EmployerLayout from '@/layouts/EmployerLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, Building2, CheckCircle } from 'lucide-react'
import SkillTag from '@/components/SkillTag'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

type CompanyFormData = {
  companyName: string
  about: string
  industry: string
  size: string
  website: string
  address: string
  foundedYear: number | string
  benefits: string[]
}

const defaultFormData: CompanyFormData = {
  companyName: '',
  about: '',
  industry: 'other',
  size: 'startup',
  website: '',
  address: '',
  foundedYear: '',
  benefits: [],
}

const industryLabels: Record<string, string> = {
  technology: 'Công nghệ thông tin',
  finance: 'Tài chính / Ngân hàng',
  healthcare: 'Y tế / Dược phẩm',
  consulting: 'Tư vấn / Dịch vụ',
  logistics: 'Logistics / Vận tải',
  education: 'Giáo dục / Đào tạo',
  marketing: 'Marketing / Truyền thông',
  manufacturing: 'Sản xuất / Chế tạo',
  other: 'Khác',
}

const sizeLabels: Record<string, string> = {
  startup: 'Startup (1 – 50 nhân viên)',
  small: 'Nhỏ (51 – 200 nhân viên)',
  medium: 'Vừa (201 – 1.000 nhân viên)',
  large: 'Lớn (1.000+ nhân viên)',
}

export default function CompanyProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData)
  const [newBenefit, setNewBenefit] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ data: CompanyFormData }>('/api/users/me/company-profile')
        const d = res.data
        setFormData({
          companyName: d.companyName || '',
          about: d.about || '',
          industry: d.industry || 'other',
          size: d.size || 'startup',
          website: d.website || '',
          address: d.address || '',
          foundedYear: d.foundedYear || '',
          benefits: d.benefits || [],
        })
      } catch {
        toast.error('Không tải được hồ sơ công ty, hiển thị mặc định')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/users/me/company-profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          foundedYear: formData.foundedYear ? Number(formData.foundedYear) : undefined,
        }),
      })
      toast.success('Đã lưu hồ sơ công ty thành công!')
      setIsEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleAddBenefit = () => {
    const trimmed = newBenefit.trim()
    if (trimmed && !formData.benefits.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, trimmed] }))
      setNewBenefit('')
    }
  }

  const handleRemoveBenefit = (benefit: string) => {
    setFormData((prev) => ({ ...prev, benefits: prev.benefits.filter((b) => b !== benefit) }))
  }

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </EmployerLayout>
    )
  }

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Hồ sơ Công ty
            </h1>
            <p className="text-foreground/70">Quản lý thông tin công ty hiển thị với ứng viên</p>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Lưu thay đổi
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Building2 className="w-4 h-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>

        <Card className="p-8 border border-border mb-8">
          <div className="relative h-32 rounded-lg bg-gradient-to-r from-primary to-primary/50 mb-6 flex items-center justify-center">
            <span className="text-white/60 text-sm">Banner công ty</span>
          </div>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center border-4 border-background flex-shrink-0 shadow-md">
              <span className="text-3xl font-bold text-primary">
                {(formData.companyName || '?').substring(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">Tên công ty</label>
              {isEditing ? (
                <Input
                  value={formData.companyName}
                  placeholder="Tên công ty của bạn..."
                  onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                />
              ) : (
                <h2 className="text-2xl font-bold text-foreground">{formData.companyName || '(Chưa cập nhật)'}</h2>
              )}

              <label className="block text-sm font-medium text-foreground mb-2 mt-4">Địa chỉ</label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  placeholder="Địa chỉ trụ sở chính..."
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                />
              ) : (
                <p className="text-foreground/70">{formData.address || '(Chưa cập nhật)'}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8 border border-border mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Giới thiệu công ty</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Mô tả / Giới thiệu</label>
              {isEditing ? (
                <Textarea
                  value={formData.about}
                  placeholder="Mô tả hoạt động, văn hóa và giá trị của công ty..."
                  onChange={(e) => setFormData((p) => ({ ...p, about: e.target.value }))}
                  rows={4}
                />
              ) : (
                <p className="text-foreground/70 whitespace-pre-wrap">{formData.about || '(Chưa cập nhật)'}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Lĩnh vực</label>
                {isEditing ? (
                  <Select value={formData.industry} onValueChange={(v) => setFormData((p) => ({ ...p, industry: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(industryLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground/70">{industryLabels[formData.industry] || formData.industry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Quy mô</label>
                {isEditing ? (
                  <Select value={formData.size} onValueChange={(v) => setFormData((p) => ({ ...p, size: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(sizeLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground/70">{sizeLabels[formData.size] || formData.size}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                {isEditing ? (
                  <Input
                    type="url"
                    value={formData.website}
                    placeholder="https://company.com"
                    onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                  />
                ) : formData.website ? (
                  <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {formData.website}
                  </a>
                ) : (
                  <p className="text-foreground/70">(Chưa cập nhật)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Năm thành lập</label>
                {isEditing ? (
                  <Input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={formData.foundedYear}
                    placeholder="VD: 2015"
                    onChange={(e) => setFormData((p) => ({ ...p, foundedYear: e.target.value }))}
                  />
                ) : (
                  <p className="text-foreground/70">{formData.foundedYear || '(Chưa cập nhật)'}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Phúc lợi & Quyền lợi</h2>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {formData.benefits.length > 0 ? formData.benefits.map((benefit) => (
                <SkillTag
                  key={benefit}
                  skill={benefit}
                  removable={isEditing}
                  onRemove={handleRemoveBenefit}
                  variant="default"
                />
              )) : (
                <p className="text-foreground/50 text-sm">(Chưa có phúc lợi nào)</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="VD: Bảo hiểm y tế, Thưởng KPI..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBenefit() } }}
              />
              <Button onClick={handleAddBenefit} variant="outline" className="gap-2 flex-shrink-0">
                <Plus className="w-4 h-4" />
                Thêm
              </Button>
            </div>
          )}
        </Card>
      </div>
    </EmployerLayout>
  )
}
