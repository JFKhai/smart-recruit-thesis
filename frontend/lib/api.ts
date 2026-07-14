import { getToken } from '@/lib/auth-storage'

const DEFAULT_API = 'http://localhost:5000'

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type AuthResponse = {
  _id: string
  email: string
  role: 'candidate' | 'employer' | 'admin'
  token: string
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options
  const h = new Headers(headers)
  h.set('Content-Type', 'application/json')
  if (!skipAuth && typeof window !== 'undefined') {
    const token = getToken()
    if (token) {
      h.set('Authorization', `Bearer ${token}`)
    }
  }
  const base = getApiBase()
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, { ...rest, headers: h })
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    let msg = res.statusText
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const m = (data as { message: unknown }).message
      if (Array.isArray(m)) {
        msg = m.map(String).join(', ')
      } else if (typeof m === 'string') {
        msg = m
      } else if (m != null) {
        msg = String(m)
      }
    }
    throw new ApiError(msg, res.status, data)
  }

  return data as T
}
