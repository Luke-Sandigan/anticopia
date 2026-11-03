import { NavLink } from 'react-router-dom'
import './StudentDashboardPage.css'

const stats = [
  { label: 'Classes', value: '3' },
  { label: 'Upcoming exams', value: '2' },
  { label: 'Pending submissions', value: '0' },
  { label: 'Latest grade', value: '88%' },
]

const exams = [
  { name: 'Midterm: Data Structures', when: 'Today, 10:00', status: 'Active' },
  { name: 'Quiz 3: SQL Joins', when: 'Oct 22, 14:00', status: 'Scheduled' },
  { name: 'Finals: Intro to Programming', when: 'Dec 10, 09:00', status: 'Draft' },
]

export function StudentDashboardPage() {
  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <h2 className="student-logo">♢ Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard" className="student-active">
            Dashboard
          </NavLink>
          <NavLink to="/student/classes">My classes</NavLink>
          <a href="#available-exams">Exams</a>
          <a href="#announcements">My grades</a>
          <a href="#announcements">Exam history</a>
          <a href="#settings">Settings</a>
        </nav>

        <div className="student-sidebar-bottom">
          <span>Light / dark</span>
          <NavLink to="/signin">Sign out</NavLink>
        </div>
      </aside>

      <main className="student-main">
        <header className="student-header">
          <h1>Hi, Maria</h1>
          <p>Your exams and grades at a glance.</p>
        </header>

        <section className="student-stats">
          {stats.map((stat) => (
            <div className="student-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        <div className="student-content">
          <section className="student-panel" id="available-exams">
            <h3>Available exams</h3>

            <div className="student-table-wrapper">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>When</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.name}>
                      <td>{exam.name}</td>
                      <td>{exam.when}</td>
                      <td>
                        <span className={`student-status ${exam.status.toLowerCase()}`}>
                          ● {exam.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="student-view-button"
                          type="button"
                          disabled
                          title="Exam details will be implemented in UI-15"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="student-panel student-announcements" id="announcements">
            <h3>Announcements</h3>

            <div className="student-announcement">
              <strong>Midterm moved to Room 204</strong>
              <p>Hi, Rivera · Today</p>
            </div>

            <div className="student-announcement">
              <strong>Bring your student ID</strong>
              <p>Mr. Cruz · Yesterday</p>
            </div>
          </section>
        </div>

        <span className="student-signed-in">Signed in</span>
      </main>
    </div>
  )
}