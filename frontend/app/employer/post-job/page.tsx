'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const initialFormData = {
  title: '',
  industry: '',
  workType: '',
  location: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  description: '',
  requiredSkills: '',
  niceToHaveSkills: '',
  experienceLevel: '',
  education: '',
  deadline: '',
  duration: '',
}

export default function PostJobPage() {
  const router = useRouter()
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const reqSkills = formData.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const niceSkills = formData.niceToHaveSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const requirements = [...reqSkills, ...niceSkills]

    let extra = ''
    if (formData.industry) extra += `\nIndustry: ${formData.industry}`
    if (formData.workType) extra += `\nWork type: ${formData.workType}`
    if (formData.experienceLevel) extra += `\nExperience: ${formData.experienceLevel}`
    if (formData.education) extra += `\nEducation: ${formData.education}`
    if (formData.salaryMin || formData.salaryMax) {
      extra += `\nSalary: ${formData.currency} ${formData.salaryMin || '?'} – ${formData.salaryMax || '?'}`
    }

    let expiresAt: string | undefined
    if (formData.deadline) {
      expiresAt = new Date(formData.deadline).toISOString()
    } else if (formData.duration && Number(formData.duration) > 0) {
      const d = new Date()
      d.setDate(d.getDate() + Number(formData.duration))
      expiresAt = d.toISOString()
    }

    try {
      await apiFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description + extra,
          requirements,
          location: formData.location || undefined,
          expiresAt,
          isEmailEnabled: true,
          status: 'open',
        }),
      })
      toast.success('Đã đăng tin tuyển dụng')
      router.push('/employer/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể đăng tin')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Post a New Job</h1>
          <p className="text-foreground/70">Create a job posting and find AI-matched candidates</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 sm:p-8 border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Job Basics</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Job Title *
                      </label>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Senior React Developer"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Industry
                        </label>
                        <Select value={formData.industry} onValueChange={(value) => handleSelect('industry', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Work Type
                        </label>
                        <Select value={formData.workType} onValueChange={(value) => handleSelect('workType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select work type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="onsite">On-site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Location
                        </label>
                        <Input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="e.g., San Francisco, CA"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Salary Min
                        </label>
                        <Input
                          type="number"
                          name="salaryMin"
                          value={formData.salaryMin}
                          onChange={handleChange}
                          placeholder="100000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Salary Max
                        </label>
                        <Input
                          type="number"
                          name="salaryMax"
                          value={formData.salaryMax}
                          onChange={handleChange}
                          placeholder="150000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Currency
                        </label>
                        <Select value={formData.currency} onValueChange={(value) => handleSelect('currency', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="VND">VND</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Job Description</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Job Description *
                      </label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe the role, responsibilities, and what you're looking for..."
                        rows={6}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Required Skills (comma-separated)
                      </label>
                      <Input
                        type="text"
                        name="requiredSkills"
                        value={formData.requiredSkills}
                        onChange={handleChange}
                        placeholder="React, TypeScript, Node.js"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nice-to-Have Skills (comma-separated)
                      </label>
                      <Input
                        type="text"
                        name="niceToHaveSkills"
                        value={formData.niceToHaveSkills}
                        onChange={handleChange}
                        placeholder="AWS, Docker, GraphQL"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Hạn nộp hồ sơ (tùy chọn)
                        </label>
                        <Input
                          type="date"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Hoặc số ngày hiển thị tin
                        </label>
                        <Input
                          type="number"
                          name="duration"
                          min={1}
                          value={formData.duration}
                          onChange={handleChange}
                          placeholder="Ví dụ: 30"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Experience Level
                        </label>
                        <Select value={formData.experienceLevel} onValueChange={(value) => handleSelect('experienceLevel', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="mid">Mid Level</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Education
                        </label>
                        <Input
                          type="text"
                          name="education"
                          value={formData.education}
                          onChange={handleChange}
                          placeholder="Bachelor's in CS or equivalent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6 flex gap-4">
                  <Button type="submit" size="lg" disabled={submitting}>
                    {submitting ? 'Đang đăng...' : 'Publish Job'}
                  </Button>
                  <Button type="button" variant="outline" size="lg" disabled={submitting}>
                    Save as Draft
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div>
            <Card className="p-6 border border-border sticky top-8">
              <h3 className="font-semibold text-foreground mb-4">Job Preview</h3>
              <div className="space-y-3 text-sm">
                {formData.title && (
                  <>
                    <div>
                      <p className="font-semibold text-foreground">{formData.title}</p>
                      <p className="text-foreground/70 text-xs">TechCorp</p>
                    </div>
                  </>
                )}

                {formData.workType && formData.location && (
                  <div className="p-3 bg-foreground/5 rounded-lg">
                    <p className="text-xs text-foreground/70">
                      {formData.workType.charAt(0).toUpperCase() + formData.workType.slice(1)} • {formData.location}
                    </p>
                  </div>
                )}

                {formData.salaryMin && formData.salaryMax && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700">
                      {formData.currency} {formData.salaryMin} - {formData.salaryMax}
                    </p>
                  </div>
                )}

                {formData.requiredSkills && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.requiredSkills
                        .split(',')
                        .slice(0, 3)
                        .map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">Preview updates as you fill the form</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </EmployerLayout>
  )
}
