'use client'

import React from 'react'
import CandidateLayout from '@/layouts/CandidateLayout'
import JobAlertsManager from '@/components/candidate/JobAlertsManager'
import EmailPreferences from '@/components/candidate/EmailPreferences'

export default function NotificationSettingsPage() {
  return (
    <CandidateLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Cài đặt thông báo việc làm
          </h1>
          <p className="text-foreground/70">
            Quản lý email gợi ý việc làm và các bộ lọc thông báo của bạn.
          </p>
        </div>

        <EmailPreferences />

        <JobAlertsManager />
      </div>
    </CandidateLayout>
  )
}
