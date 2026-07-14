'use client'

import React, { useState } from 'react'
import EmployerLayout from '@/layouts/EmployerLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Sparkles, Copy, RefreshCcw } from 'lucide-react'

const defaultPost = `🚀 We are hiring a Frontend Developer (React/Next.js)!

Join our team to build modern products with TypeScript and AI-powered workflows.

✅ Remote-friendly
✅ Competitive package
✅ Growth-focused culture

Apply now: https://example.com/jobs/frontend`

export default function FacebookPostGeneratorPage() {
  const [jobTitle, setJobTitle] = useState('Frontend Developer')
  const [companyName, setCompanyName] = useState('Smart Recruit')
  const [postContent, setPostContent] = useState(defaultPost)

  const handleGenerateMock = () => {
    setPostContent(`🚀 ${companyName} is hiring ${jobTitle}!

We are looking for motivated people to build impactful products with modern technologies.

✅ Flexible working model
✅ Attractive benefits
✅ Learning and growth opportunities

Apply now: https://example.com/jobs`)
  }

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Facebook Post Generator</h1>
          <p className="text-foreground/70">
            Draft social posts quickly from your hiring needs (mock AI output for UI phase).
          </p>
        </div>

        <Card className="p-6 border border-border mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium block mb-2">Company</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Job title</label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerateMock} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Mock Post
            </Button>
            <Button variant="outline" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
        </Card>

        <Card className="p-6 border border-border">
          <label className="text-sm font-medium block mb-2">Post content</label>
          <Textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={12}
            placeholder="Generated post content..."
          />
          <div className="flex justify-end mt-4">
            <Button variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Text
            </Button>
          </div>
        </Card>
      </div>
    </EmployerLayout>
  )
}
