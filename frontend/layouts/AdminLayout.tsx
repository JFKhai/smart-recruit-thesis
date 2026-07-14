'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="lg:hidden sticky top-0 z-40 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-4 py-4">
        <p className="font-bold text-white text-lg">Admin Panel</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/70"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
            <AdminSidebar />
          </div>
        </div>
      )}

      <div className="flex">
        <div className="hidden lg:block w-64 border-r border-gray-800 fixed h-screen left-0 top-0">
          <AdminSidebar />
        </div>

        <main className="flex-1 lg:ml-64 w-full min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
