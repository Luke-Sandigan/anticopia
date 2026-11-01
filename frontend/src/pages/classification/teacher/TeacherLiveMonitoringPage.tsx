import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { currentStudentStatus, monitoredStudents, roomAlerts, type StudentStatus } from '../../../data/liveMonitoring'

function statusClass(status: StudentStatus) {
  return status.toLowerCase().replace(' ', '-')
}

function alertClass(kind: 'Left tab' | 'Copied text') {
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
            {monitoredStudents.map((student) => {
              const status = currentStudentStatus(student.events)

              return (
                <Link className={`student-stream ${statusClass(status)}`} key={student.id} to={`/teacher/live-monitoring/${student.id}`}>
                  <div className="stream-preview" aria-label={`${student.name} screen preview`}>
                    {status === 'Offline' ? (
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
                    <span className={`stream-status ${statusClass(status)}`}><i />{status}</span>
                  </footer>
                </Link>
              )
            })}
          </section>

          <aside className="dashboard-panel monitoring-alerts" aria-label="Live alerts">
            <h2>Alerts</h2>
            <div className="monitoring-alert-list">
              {roomAlerts.map((alert, index) => (
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
