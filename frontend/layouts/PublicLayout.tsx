import React from 'react'
import PublicNavbar from '@/components/PublicNavbar'
import Footer from '@/components/Footer'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  )
}
