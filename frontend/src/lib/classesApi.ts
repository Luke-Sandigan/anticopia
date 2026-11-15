export type ClassDetails = {
  id: string
  name: string
  section: string
  subject: string
  term: string
  code: string
}

export type RosterStudent = {
  id: string
  name: string
  enrollment: 'Enrolled'
  account: 'Active' | 'Not verified'
  performance: number
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(payload?.error ?? `Request failed (${response.status})`)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export async function fetchClassDetails(classId: string) {
  return (await request<{ class: ClassDetails }>(`/classes/${encodeURIComponent(classId)}`)).class
}

export async function fetchRoster(classId: string) {
  return (await request<{ roster: RosterStudent[] }>(`/classes/${encodeURIComponent(classId)}/roster`)).roster
}

export async function addRosterStudent(classId: string, identifier: string) {
  return (await request<{ student: RosterStudent }>(`/classes/${encodeURIComponent(classId)}/roster`, {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  })).student
}

export async function removeRosterStudent(classId: string, studentId: string) {
  await request<void>(`/classes/${encodeURIComponent(classId)}/roster/${encodeURIComponent(studentId)}`, { method: 'DELETE' })
}
