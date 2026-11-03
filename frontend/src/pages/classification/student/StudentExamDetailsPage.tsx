import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './StudentDashboardPage.css'
import './StudentExamDetailsPage.css'

export function StudentExamDetailsPage() {
  const [agreed, setAgreed] = useState(false)
  const [screenTested, setScreenTested] = useState(false)

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <h2 className="student-logo">♢ Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard">Dashboard</NavLink>
          <NavLink to="/student/classes">My classes</NavLink>
          <NavLink to="/student/exam-details" className="student-active">
            Exams
          </NavLink>
          <a href="#grades">My grades</a>
          <a href="#history">Exam history</a>
          <a href="#settings">Settings</a>
        </nav>

        <div className="student-sidebar-bottom">
          <span>Light / dark</span>
          <NavLink to="/signin">Sign out</NavLink>
        </div>
      </aside>

      <main className="student-main">
        <header className="exam-details-header">
          <h1>Midterm: Data Structures</h1>
          <p>IT-201 · Ms. Rivera</p>
        </header>

        <div className="exam-details-content">
          <section className="exam-instructions-card">
            <h3>Instructions and rules</h3>

            <ul>
              <li>90 minutes, 3 questions, one attempt.</li>
              <li>No notes or calculator allowed.</li>
              <li>Stay in fullscreen and do not switch tabs.</li>
            </ul>
          </section>

          <section className="exam-before-card">
            <h3>Before you start</h3>

            <p className="exam-monitoring-note">
              Anticopia records tab switches, copy and paste,
              and fullscreen exits during the exam.
            </p>

            <label className="exam-agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>I understand the monitoring rules</span>
            </label>

            <div className="exam-status-list">
              <span className="exam-status-ok">
                ● Connection OK
              </span>

              <span className="exam-status-warning">
                ● Screen sharing not tested
              </span>
            </div>

            <button
              className="exam-test-button"
              type="button"
              onClick={() => setScreenTested(true)}
            >
              Test screen sharing
            </button>

            {screenTested && (
              <p className="exam-test-message" role="status">
                Screen-sharing check is a UI placeholder.
                Browser permission testing will be added later.
              </p>
            )}

            <button
              className="exam-start-button"
              type="button"
              disabled={!agreed}
              onClick={() =>
                window.alert(
                  'Exam-taking interface will be implemented in UI-16.'
                )
              }
            >
              Start exam
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}