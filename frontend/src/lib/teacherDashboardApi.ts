import { apiBaseUrl, authTokenKey } from './authApi'

export type TeacherDashboard = {
  teacherName: string
  stats: { classes: number; students: number; activeExams: number; awaitingGrading: number }
  exams: { id: string; title: string; classCode: string; startsAt: string | null; status: 'ongoing' | 'scheduled' | 'draft' }[]
  alerts: { id: string; type: string; student: string; details: string | null; createdAt: string }[]
  summary: { title: string; averageScore: number | null; submitted: number; enrolled: number } | null
  classes: { id: string; name: string; section: string; studentCount: number }[]
}

export async function fetchTeacherDashboard(signal: AbortSignal): Promise<TeacherDashboard | 'student' | null> {
  const token = window.sessionStorage.getItem(authTokenKey)
  if (!token) return null

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new Error('Could not reach the Anticopia API. Check your connection and try again.', { cause: error })
  }
  if (response.status === 401) {
    if (window.sessionStorage.getItem(authTokenKey) === token) window.sessionStorage.removeItem(authTokenKey)
    return null
  }
  if (response.status === 403) return 'student'
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Dashboard request failed (${response.status})`)
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The dashboard API returned an unexpected response. Check the configured API URL.')
  }
  return response.json() as Promise<TeacherDashboard>
}
