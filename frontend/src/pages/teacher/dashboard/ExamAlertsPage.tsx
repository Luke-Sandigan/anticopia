import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DashboardSidebar } from '../../../components/teacher/DashboardSidebar'
import { fetchExamAlerts, type ExamAlert } from '../../../lib/teacherDashboardApi'

export function ExamAlertsPage() {
  const { examId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('studentId')
  return <ExamAlertsContent key={JSON.stringify([examId, studentId])} examId={examId} studentId={studentId} />
}

function ExamAlertsContent({ examId, studentId }: { examId: string; studentId: string | null }) {
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [alerts, setAlerts] = useState<ExamAlert[]>()
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchExamAlerts(examId, studentId, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      if (result === null) navigate('/signin', { replace: true })
      else if (result === 'student') navigate('/student/dashboard', { replace: true })
      else if (result === 'not-found') setNotFound(true)
      else setAlerts(result)
    }).catch(() => {
      if (!controller.signal.aborted) setError('Could not load alerts. Check your connection and try again.')
    })
    return () => controller.abort()
  }, [examId, studentId, navigate, attempt])

  function toggleTheme() {
    setDark((current) => {
      window.localStorage.setItem('anticopia-theme', current ? 'light' : 'dark')
      return !current
    })
  }

  return <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
    <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
    <main className="dashboard-main">
      <Link to="/teacher/dashboard">← Back to dashboard</Link>
      <header className="dashboard-header"><h1>Exam alerts</h1>
        <p>{studentId ? 'Alerts for the selected student.' : 'Integrity alerts for this exam.'}</p>
      </header>
      <section className="dashboard-panel alerts-panel" aria-label="Exam alerts">
        {notFound && <p role="alert">Exam not found or no longer available.</p>}
        {error && <div role="alert"><p>{error}</p><button type="button" className="table-action primary" onClick={() => { setError(''); setAttempt((value) => value + 1) }}>Try again</button></div>}
        {!alerts && !error && !notFound && <p role="status">Loading alerts…</p>}
        {alerts && !alerts.length && <p>No alerts found{studentId ? ' for this student' : ' for this exam'}.</p>}
        {alerts && alerts.length > 0 && <ul>{alerts.map((alert) => <li key={alert.alertId}>
          <strong>{alert.studentName || 'Unknown student'}</strong>
          <p>Event: {alert.eventType}</p>
          <p>Details: {alert.details || 'No details provided'}</p>
          <p>Status: {alert.status}</p>
          <time dateTime={alert.createdAt}>{new Date(alert.createdAt).toLocaleString()}</time>
        </li>)}</ul>}
      </section>
    </main>
  </div>
}
