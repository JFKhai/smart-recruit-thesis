import React from 'react'
import Link from 'next/link'
import { Briefcase, Mail, Linkedin, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-foreground/5 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-primary">Smart Recruit</span>
            </div>
            <p className="text-sm text-foreground/70">
              AI-powered job matching platform connecting talent with opportunity.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">For Candidates</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  AI Matches
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Career Advice
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">For Employers</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Find Talent
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-foreground/60 mb-4 md:mb-0">
              © 2024 Smart Recruit. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-foreground/60 hover:text-foreground transition">
                <Mail className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-foreground transition">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-foreground transition">
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
