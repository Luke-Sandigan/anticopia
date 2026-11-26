import type { AccountRole } from '../components/auth/RoleTabs'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api').replace(/\/$/, '')

type AuthResponse = {
  token: string
  user: { id: string; role: AccountRole; email: string }
}

async function submitAuth(path: string, fields: FormData, extra?: { role: AccountRole }): Promise<AuthResponse> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/auth${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(fields), ...extra }),
    })
  } catch {
    throw new Error('Could not connect to the server. Check your connection and try again.')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string; details?: string[] } | null
    throw new Error(payload?.details?.join('. ') || payload?.error || `Request failed (${response.status})`)
  }
  return response.json() as Promise<AuthResponse>
}

export function signIn(role: AccountRole, fields: FormData) {
  return submitAuth('/login', fields, { role })
}

export function registerAccount(role: AccountRole, fields: FormData) {
  return submitAuth(`/register/${role}`, fields)
}
