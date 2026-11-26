import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTeacherDashboard, type TeacherDashboard } from '../../../lib/teacherDashboardApi'

export function teacherDashboardStats(stats: TeacherDashboard['stats']) {
  return [
    { label: 'Classes', value: stats.classes.toLocaleString() },
    { label: 'Enrolled students', value: stats.students.toLocaleString() },
    { label: 'Active exams', value: stats.activeExams.toLocaleString() },
    { label: 'Awaiting grading', value: stats.awaitingGrading.toLocaleString() },
  ]
}

export function useTeacherDashboardPageLogic() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [dashboard, setDashboard] = useState<TeacherDashboard>()
  const [error, setError] = useState('')
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchTeacherDashboard(controller.signal).then((data) => {
      if (controller.signal.aborted) return
      if (data === 'student') navigate('/student/dashboard', { replace: true })
      else if (data) setDashboard(data)
      else navigate('/signin', { replace: true })
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : 'Could not load the dashboard.')
      }
    })
    return () => controller.abort()
  }, [navigate, requestCount])

  function retry() {
    setError('')
    setRequestCount((count) => count + 1)
  }

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  return { dark, toggleTheme, dashboard, error, retry }
}
