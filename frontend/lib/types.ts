export interface Candidate {
  id: string
  email: string
  name: string
  avatar?: string
  location: string
  experience_level: 'entry' | 'mid' | 'senior' | 'expert'
  cv_skills: string[]
  headline?: string
  bio?: string
  createdAt: Date
}

export interface Employer {
  id: string
  email: string
  companyId: string
  name: string
  avatar?: string
  role: string
  createdAt: Date
}

export interface Company {
  id: string
  name: string
  logo?: string
  about?: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  industry: string
  website?: string
  founded_year?: number
  benefits: string[]
  culture_photos?: string[]
}

export interface Job {
  id: string
  title: string
  company_id: string
  company_name: string
  company_logo?: string
  description: string
  salary_min?: number
  salary_max?: number
  currency?: string
  location: string
  work_type: 'remote' | 'hybrid' | 'onsite'
  required_skills: string[]
  nice_to_have_skills?: string[]
  experience_level: 'entry' | 'mid' | 'senior' | 'expert'
  education?: string
  posted_date: Date
  deadline?: Date
  status: 'active' | 'paused' | 'closed'
}

export interface Application {
  id: string
  candidate_id: string
  job_id: string
  status: 'applied' | 'reviewing' | 'interview' | 'accepted' | 'rejected'
  applied_date: Date
  match_score: number // 0-100
  ai_insight?: string
  notes?: string
  updated_date?: Date
}

export interface JobMatch {
  job_id: string
  candidate_id: string
  match_score: number // 0-100
  matching_skills: string[]
  missing_skills: string[]
  recommendation: string
}

export interface CandidateMatch {
  candidate_id: string
  job_id: string
  match_score: number // 0-100
  candidate_name: string
  candidate_avatar?: string
  candidate_headline?: string
  matching_skills: string[]
}

export interface NotificationSettings {
  user_id: string
  user_type: 'candidate' | 'employer'
  job_match_notifications?: boolean
  job_match_frequency?: 'immediately' | 'daily' | 'weekly'
  min_match_score?: number // 0-100
  application_updates?: boolean
  interview_notifications?: boolean
  pause_all?: boolean
  auto_email_matched?: boolean
  email_top_10_only?: boolean
  match_threshold?: number // 0-100
  application_alerts?: boolean
  alert_frequency?: 'realtime' | 'daily' | 'weekly'
  job_reminders?: boolean
}

export interface Activity {
  id: string
  user_id: string
  user_type: 'candidate' | 'employer'
  type: 'application' | 'match' | 'interview' | 'message' | 'update'
  title: string
  description?: string
  related_id?: string // job_id or application_id
  created_at: Date
}
