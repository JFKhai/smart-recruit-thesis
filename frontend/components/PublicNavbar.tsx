'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">Smart Recruit</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm text-foreground/70 hover:text-foreground transition">
              How it works
            </Link>
            <Link href="#" className="text-sm text-foreground/70 hover:text-foreground transition">
              For Employers
            </Link>
            <Link href="#" className="text-sm text-foreground/70 hover:text-foreground transition">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/login?role=candidate">Candidate Sign In</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/login?role=employer">Employer Sign In</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
