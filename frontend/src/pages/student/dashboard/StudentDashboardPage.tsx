import { NavLink } from 'react-router-dom'
import { studentDashboardStats, studentUpcomingExams } from './StudentDashboardPage.logic'

export function StudentDashboardPage() {
  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <h2 className="student-logo"><img src="/anticopia-logo.png" alt="" />Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard" className="student-active">
            Dashboard
          </NavLink>
          <NavLink to="/student/classes">My classes</NavLink>
          <NavLink to="/student/exam-details">Exams</NavLink>
          <NavLink to="/student/grades">My grades</NavLink>
          <NavLink to="/student/exam-history">Exam history</NavLink>
          <NavLink to="/student/settings">Settings</NavLink>
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
          {studentDashboardStats.map((stat) => (
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
                  {studentUpcomingExams.map((exam) => (
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
