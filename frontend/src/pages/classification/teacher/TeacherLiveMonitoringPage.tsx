import { useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'

type StudentStatus = 'Focused' | 'Left tab' | 'Offline'
type AlertKind = 'Left tab' | 'Copied text'

const students: { name: string; status: StudentStatus }[] = [
  { name: 'Maria Santos', status: 'Focused' },
  { name: 'Juan dela Cruz', status: 'Focused' },
  { name: 'Ana Reyes', status: 'Left tab' },
  { name: 'Carlo Mendoza', status: 'Focused' },
  { name: 'Bea Lim', status: 'Focused' },
  { name: 'Paolo Garcia', status: 'Offline' },
  { name: 'Isa Navarro', status: 'Focused' },
  { name: 'Miguel Tan', status: 'Left tab' },
]

const alerts: { kind: AlertKind; student: string; detail: string; time: string }[] = [
  { kind: 'Left tab', student: 'Miguel Tan', detail: 'Exited fullscreen', time: '22:29' },
  { kind: 'Left tab', student: 'Ana Reyes', detail: 'Switched to another tab', time: '22:25' },
  { kind: 'Copied text', student: 'Miguel Tan', detail: 'Pasted text into an answer', time: '22:17' },
  { kind: 'Left tab', student: 'Ana Reyes', detail: 'Switched to another tab', time: '10:02' },
  { kind: 'Copied text', student: 'Miguel Tan', detail: 'Copied text from question 2', time: '10:05' },
]

function statusClass(status: StudentStatus) {
  return status.toLowerCase().replace(' ', '-')
}

function alertClass(kind: AlertKind) {
  return kind === 'Copied text' ? 'copied' : 'tab'
}

export function TeacherLiveMonitoringPage() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [sessionActive, setSessionActive] = useState(true)

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} activePage="Live monitoring" />
      <main className="dashboard-main monitoring-main">
        <header className="monitoring-header">
          <div>
            <h1>Live monitoring: Midterm</h1>
            <p>Room 204 · 7 of 8 students connected</p>
          </div>
          <button
            type="button"
            className="end-session-button"
            onClick={() => setSessionActive(false)}
            disabled={!sessionActive}
          >
            {sessionActive ? 'End session' : 'Session ended'}
          </button>
        </header>

        <div className="monitoring-layout">
          <section className="monitoring-students" aria-label="Student monitoring streams">
            {students.map((student) => (
              <article className={`student-stream ${statusClass(student.status)}`} key={student.name}>
                <div className="stream-preview" aria-label={`${student.name} screen preview`}>
                  {student.status === 'Offline' ? (
                    <span>No stream</span>
                  ) : (
                    <div className="stream-placeholder" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                </div>
                <footer>
                  <strong>{student.name}</strong>
                  <span className={`stream-status ${statusClass(student.status)}`}><i />{student.status}</span>
                </footer>
              </article>
            ))}
          </section>

          <aside className="dashboard-panel monitoring-alerts" aria-label="Live alerts">
            <h2>Alerts</h2>
            <div className="monitoring-alert-list">
              {alerts.map((alert, index) => (
                <article className="monitoring-alert" key={`${alert.student}-${alert.time}-${index}`}>
                  <span className={`monitoring-alert-kind ${alertClass(alert.kind)}`}><i />{alert.kind}</span>
                  <strong>{alert.student}</strong>
                  <p>{alert.detail}</p>
                  <time>{alert.time}</time>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
