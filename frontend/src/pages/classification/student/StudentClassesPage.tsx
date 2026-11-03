import { NavLink } from 'react-router-dom'
import './StudentDashboardPage.css'
import './StudentClassesPage.css'

const classes = [
  {
    code: 'IT-201',
    name: 'Data Structures',
    section: 'Section A',
    teacher: 'Ms. Rivera',
  },
  {
    code: 'IT-305',
    name: 'Databases',
    section: 'Section B',
    teacher: 'Mr. Reyes',
  },
  {
    code: 'IT-110',
    name: 'Intro to Programming',
    section: 'Section C',
    teacher: 'Ms. Rivera',
  },
]

export function StudentClassesPage() {
  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <h2 className="student-logo">♢ Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard">Dashboard</NavLink>
          <NavLink to="/student/classes" className="student-active">
            My classes
          </NavLink>
          <a href="#exams">Exams</a>
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
          {classes.map((classItem) => (
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