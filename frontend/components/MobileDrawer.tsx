'use client'

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import CandidateSidebar from '@/components/CandidateSidebar'
import EmployerSidebar from '@/components/EmployerSidebar'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: 'candidate' | 'employer'
}

export default function MobileDrawer({ open, onOpenChange, variant }: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-64">
        {variant === 'candidate' ? <CandidateSidebar /> : <EmployerSidebar />}
      </SheetContent>
    </Sheet>
  )
}
