import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { currentStudentStatus, monitoredStudents, type MonitoringEventKind } from '../../../data/liveMonitoring'

function eventClass(kind: MonitoringEventKind) {
  if (kind === 'Exam started') return 'started'
  if (kind === 'Copied text') return 'copied'
  if (kind === 'Connection lost') return 'offline'
  return 'tab'
}

function eventLabel(kind: MonitoringEventKind, detail: string) {
  return kind === 'Exam started' ? kind : detail
}

export function TeacherStudentMonitoringPage() {
  const { studentId } = useParams()
  const student = monitoredStudents.find((item) => item.id === studentId)
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [decision, setDecision] = useState('')
  const [savedDecision, setSavedDecision] = useState(false)

  if (!student) return <Navigate to="/teacher/live-monitoring" replace />

  const studentStatus = currentStudentStatus(student.events)

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function saveDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedDecision(true)
  }

  const latestEvent = student.events.at(-1)

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} activePage="Live monitoring" />
      <main className="dashboard-main monitoring-detail-main">
        <header className="monitoring-detail-header">
          <div>
            <h1>{student.name}</h1>
            <p>{student.studentNumber} · Midterm: Data Structures</p>
          </div>
          <Link className="back-to-room" to="/teacher/live-monitoring">Back to room</Link>
        </header>

        <div className="monitoring-detail-layout">
          <div className="monitoring-detail-left">
            <section className="dashboard-panel student-screen-panel" aria-label={`${student.name} screen`}>
              <h2>Screen</h2>
              <div className="student-screen-preview">
                {studentStatus === 'Offline' ? (
                  <span>No stream available</span>
                ) : (
                  <div className="student-screen-placeholder" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                )}
              </div>
              {latestEvent && latestEvent.kind !== 'Exam started' && (
                <span className={`screen-event ${eventClass(latestEvent.kind)}`}><i />{latestEvent.kind}</span>
              )}
            </section>

            <section className="dashboard-panel teacher-decision-panel" aria-labelledby="teacher-decision-heading">
              <h2 id="teacher-decision-heading">Teacher decision</h2>
              <form onSubmit={saveDecision}>
                <label>
                  <span>Decision (kept separate from detected events)</span>
                  <textarea
                    rows={2}
                    placeholder="No action, verbal warning, refer to department..."
                    value={decision}
                    onChange={(event) => {
                      setDecision(event.target.value)
                      setSavedDecision(false)
                    }}
                  />
                </label>
                <button type="submit" className="save-decision-button">Save decision</button>
              </form>
              {savedDecision && <p className="decision-saved" role="status">Decision saved.</p>}
            </section>
          </div>

          <aside className="dashboard-panel activity-timeline" aria-label="Activity timeline">
            <h2>Activity timeline</h2>
            <div className="timeline-events">
              {student.events.map((event) => (
                <article className="timeline-event" key={`${event.kind}-${event.time}`}>
                  <span className={`timeline-event-kind ${eventClass(event.kind)}`}><i />{eventLabel(event.kind, event.detail)}</span>
                  <time>{event.time}</time>
                  {event.kind !== 'Exam started' && (
                    <div className="timeline-event-actions">
                      <select aria-label={`Review status for ${event.detail}`} defaultValue="Needs review">
                        <option>Needs review</option>
                        <option>Reviewed</option>
                        <option>Dismissed</option>
                      </select>
                      <button type="button">Evidence</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
