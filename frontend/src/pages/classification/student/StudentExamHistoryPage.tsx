
import { useState } from "react";
import "./StudentExamHistoryPage.css";

type GradingStatus = "Pending" | "Released";

interface PastExam {
  id: number;
  exam: string;
  date: string;
  submission: string;
  grading: GradingStatus;
}

const pastExams: PastExam[] = [
  {
    id: 1,
    exam: "Midterm: Data Structures",
    date: "Today",
    submission: "Submitted",
    grading: "Pending",
  },
  {
    id: 2,
    exam: "Quiz 2: Arrays",
    date: "Oct 10",
    submission: "Submitted",
    grading: "Released",
  },
  {
    id: 3,
    exam: "Quiz 1: Basics",
    date: "Sep 26",
    submission: "Submitted",
    grading: "Released",
  },
];

const navigation = [
  { label: "Dashboard", href: "/student/dashboard" },
  { label: "My classes", href: "/student/classes" },
  { label: "Exams", href: "/student/exams" },
  { label: "My grades", href: "/student/grades" },
  { label: "Exam history", href: "/student/exam-history" },
  { label: "Settings", href: "/student/settings" },
];

export default function StudentExamHistoryPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedExam, setSelectedExam] = useState<PastExam | null>(null);

  return (
    <div className={`exam-history-layout ${darkMode ? "dark-mode" : ""}`}>
      {/* SIDEBAR */}
      <aside className="exam-history-sidebar">
        <div className="exam-history-brand">
          <img
            src="/anticopia-logo.png"
            alt="Anticopia Logo"
            className="exam-history-logo"
          />
          <span>Anticopia</span>
        </div>

        <nav className="exam-history-navigation">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`exam-history-nav-link ${
                item.label === "Exam history" ? "active" : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="exam-history-sidebar-bottom">
          <button
            className="exam-history-sidebar-action"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light mode" : "Light / dark"}
          </button>

          <a
            href="/sign-in"
            className="exam-history-sidebar-action"
          >
            Sign out
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="exam-history-main">
        <header className="exam-history-header">
          <h1>Exam history</h1>
          <p>Completed and past exams.</p>
        </header>

        {/* PAST EXAMS */}
        <section className="exam-history-card">
          <h2>Past exams</h2>

          <div className="exam-history-table-wrapper">
            <table className="exam-history-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Date</th>
                  <th>Submission</th>
                  <th>Grading</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {pastExams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.exam}</td>

                    <td>{exam.date}</td>

                    <td>{exam.submission}</td>

                    <td>
                      <span
                        className={`exam-history-status ${
                          exam.grading === "Pending"
                            ? "grading-pending"
                            : "grading-released"
                        }`}
                      >
                        <span className="exam-history-status-dot" />
                        {exam.grading}
                      </span>
                    </td>

                    <td>
                      {exam.grading === "Released" && (
                        <button
                          className="exam-history-view-button"
                          onClick={() => setSelectedExam(exam)}
                        >
                          View result
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="exam-history-footer">
            Your activity record for each exam: 0 flagged events.
          </p>
        </section>
      </main>

      {/* RESULT MODAL */}
      {selectedExam && (
        <div
          className="exam-history-modal-overlay"
          onClick={() => setSelectedExam(null)}
        >
          <div
            className="exam-history-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="exam-history-modal-close"
              onClick={() => setSelectedExam(null)}
              aria-label="Close"
            >
              ×
            </button>

            <h2>Exam result</h2>

            <p className="exam-history-modal-exam">
              {selectedExam.exam}
            </p>

            <div className="exam-history-modal-details">
              <div>
                <span>Date</span>
                <strong>{selectedExam.date}</strong>
              </div>

              <div>
                <span>Submission</span>
                <strong>{selectedExam.submission}</strong>
              </div>

              <div>
                <span>Grading status</span>
                <strong className="released-text">Released</strong>
              </div>
            </div>

            <p className="exam-history-modal-note">
              Your result has been released. Connect your actual
              exam results data to display your score and feedback here.
            </p>

            <button
              className="exam-history-modal-button"
              onClick={() => setSelectedExam(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
