'use client'

import React, { useEffect, useState } from 'react'
import EmployerLayout from '@/layouts/EmployerLayout'
import { EmployerReviewsPanel } from '@/components/reviews/CompanyReview'
import { getStoredUser } from '@/lib/auth-storage'

export default function EmployerReviewsPage() {
  const [companyUserId, setCompanyUserId] = useState('')

  useEffect(() => {
    setCompanyUserId(getStoredUser()?.id || '')
  }, [])

  return (
    <EmployerLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Đánh giá công ty
          </h1>
          <p className="text-foreground/70">
            Xem ứng viên đánh giá công ty bạn và phản hồi lại để tăng độ tin cậy.
          </p>
        </div>

        {companyUserId && <EmployerReviewsPanel companyUserId={companyUserId} />}
      </div>
    </EmployerLayout>
  )
}
