
import { grades, gradesNavigation as navigation, useStudentGradesPageLogic } from './StudentGradesPage.logic'

export default function StudentGradesPage() {
  const { darkMode, setDarkMode, currentGrade } = useStudentGradesPageLogic();

  return (
    <div className={`grades-layout ${darkMode ? "dark-mode" : ""}`}>
      {/* SIDEBAR */}
      <aside className="grades-sidebar">
        <div className="grades-brand">
          <img
            src="/anticopia-logo.png"
            alt="Anticopia Logo"
            className="grades-logo"
          />
          <span>Anticopia</span>
        </div>

        <nav className="grades-navigation">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`grades-nav-link ${
                item.label === "My grades" ? "active" : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="grades-sidebar-bottom">
          <button
            className="grades-sidebar-action"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light mode" : "Light / dark"}
          </button>

          <a href="/signin" className="grades-sidebar-action">
            Sign out
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="grades-main">
        <header className="grades-header">
          <h1>My grades</h1>
          <p>
            Current calculated grade:{" "}
            <strong>{currentGrade}%</strong>
          </p>
        </header>

        {/* SCORES TABLE */}
        <section className="grades-card">
          <h2>Scores</h2>

          <div className="grades-table-wrapper">
            <table className="grades-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assessment</th>
                  <th>Score</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.subject}</td>

                    <td>{grade.assessment}</td>

                    <td>{grade.score}%</td>

                    <td>{grade.weight}%</td>

                    <td>
                      <span
                        className={`grades-status ${
                          grade.status === "Final"
                            ? "status-final"
                            : "status-provisional"
                        }`}
                      >
                        <span className="status-dot" />
                        {grade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
