'use client'

import React, { useState } from 'react'
import EmployerLayout from '@/layouts/EmployerLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, Bell, Users } from 'lucide-react'

const initialSettings = {
  autoEmailMatched: true,
  emailTopTenOnly: false,
  matchThreshold: 70,
  applicationAlerts: true,
  alertFrequency: 'daily',
  jobReminders: true,
}

export default function EmployerEmailSettingsPage() {
  const [settings, setSettings] = useState(initialSettings)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  const handleSelect = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: isNaN(Number(value)) ? value : Number(value),
    }))
  }

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Email & Notifications
          </h1>
          <p className="text-foreground/70">
            Manage notifications about candidates, applications, and job postings
          </p>
        </div>

        {saved && (
          <Card className="p-4 border border-green-200 bg-green-50 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Settings saved successfully!</p>
            </div>
          </Card>
        )}

        <Card className="p-6 border border-border mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI-Matched Candidates</h2>
                <p className="text-sm text-foreground/70 mt-1">
                  Automatically email when candidates match your job requirements
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoEmailMatched}
                onChange={() => handleToggle('autoEmailMatched')}
                className="rounded"
              />
              <span className="text-sm font-medium text-foreground">
                {settings.autoEmailMatched ? 'On' : 'Off'}
              </span>
            </label>
          </div>

          {settings.autoEmailMatched && (
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Match Threshold
                </label>
                <Select
                  value={String(settings.matchThreshold)}
                  onValueChange={(value) => handleSelect('matchThreshold', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50% or higher</SelectItem>
                    <SelectItem value="70">70% or higher</SelectItem>
                    <SelectItem value="80">80% or higher</SelectItem>
                    <SelectItem value="90">90% or higher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailTopTenOnly}
                  onChange={() => handleToggle('emailTopTenOnly')}
                  className="rounded"
                />
                <span className="text-sm text-foreground/70">
                  Email only top 10 candidates per job
                </span>
              </label>
            </div>
          )}
        </Card>

        <Card className="p-6 border border-border mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Application Alerts</h2>
                <p className="text-sm text-foreground/70 mt-1">
                  Get notified when candidates apply to your open positions
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.applicationAlerts}
                onChange={() => handleToggle('applicationAlerts')}
                className="rounded"
              />
              <span className="text-sm font-medium text-foreground">
                {settings.applicationAlerts ? 'On' : 'Off'}
              </span>
            </label>
          </div>

          {settings.applicationAlerts && (
            <div className="border-t border-border pt-6">
              <label className="text-sm font-medium text-foreground block mb-2">
                Alert Frequency
              </label>
              <Select value={settings.alertFrequency} onValueChange={(value) => handleSelect('alertFrequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        <Card className="p-6 border border-border mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Job Post Reminders</h2>
                <p className="text-sm text-foreground/70 mt-1">
                  Get reminder when your job posts are about to expire
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.jobReminders}
                onChange={() => handleToggle('jobReminders')}
                className="rounded"
              />
              <span className="text-sm font-medium text-foreground">
                {settings.jobReminders ? 'On' : 'Off'}
              </span>
            </label>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>
          <Button onClick={() => setSettings(initialSettings)} variant="outline" size="lg">
            Reset to Default
          </Button>
        </div>
      </div>
    </EmployerLayout>
  )
}
