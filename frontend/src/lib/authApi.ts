import type { AccountRole } from '../components/auth/RoleTabs'

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api').replace(/\/$/, '')
export const authTokenKey = 'anticopia-auth-token'

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
  const result = await response.json().catch(() => null) as AuthResponse | null
  if (!result?.token || !['teacher', 'student'].includes(result.user?.role)) {
    throw new Error('The sign-in service returned an unexpected response. Check the configured API URL.')
  }
  return result
}

export function signIn(role: AccountRole, fields: FormData) {
  return submitAuth('/login', fields, { role })
}

export function registerAccount(role: AccountRole, fields: FormData) {
  return submitAuth(`/register/${role}`, fields)
}
