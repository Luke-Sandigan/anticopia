import { NavLink } from 'react-router-dom'
import { enrolledClasses } from './StudentClassesPage.logic'

export function StudentClassesPage() {
  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <h2 className="student-logo"><img src="/anticopia-logo.png" alt="" />Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard">Dashboard</NavLink>
          <NavLink to="/student/classes" className="student-active">
            My classes
          </NavLink>
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
        <header className="student-classes-header">
          <div>
            <h1>My classes</h1>
            <p>Classes you are enrolled in.</p>
          </div>

          <button
            className="student-join-button"
            type="button"
            disabled
            title="Joining classes will be connected later"
          >
            Join with code
          </button>
        </header>

        <section className="student-class-grid">
          {enrolledClasses.map((classItem) => (
            <article className="student-class-card" key={classItem.code}>
              <h3>
                {classItem.code} {classItem.name}
              </h3>

              <p>
                {classItem.section} · {classItem.teacher}
              </p>

              <button
                className="student-class-view-button"
                type="button"
                disabled
                title="Class details will be connected later"
              >
                View learners
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
