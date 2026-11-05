
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentExamResultPage.css";

type AnswerStatus = "Correct" | "Incorrect";

interface AnswerReview {
  id: number;
  question: string;
  answer: string;
  result: AnswerStatus;
}

const answerReviews: AnswerReview[] = [
  {
    id: 1,
    question: "Q1",
    answer: "Array",
    result: "Correct",
  },
  {
    id: 2,
    question: "Q2",
    answer: "FIFO",
    result: "Incorrect",
  },
  {
    id: 3,
    question: "Q3",
    answer: "True",
    result: "Correct",
  },
];

export default function StudentExamResultPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  // Mock result data
  const examTitle = "Quiz 2: Arrays";
  const score = 17;
  const totalScore = 20;
  const percentage = Math.round((score / totalScore) * 100);
  const manualGrading = "None";

  const teacherFeedback =
    "Good work. Review how arrays resize in question 4.";

  return (
    <div className={`exam-result-layout ${darkMode ? "dark-mode" : ""}`}>
      {/* SIDEBAR */}
      <aside className="exam-result-sidebar">
        <div className="exam-result-brand">
          <img
            src="/anticopia-logo.png"
            alt="Anticopia Logo"
            className="exam-result-logo"
          />
          <span>Anticopia</span>
        </div>

        <nav className="exam-result-navigation">
          <a href="/student/dashboard" className="exam-result-nav-link">
            Dashboard
          </a>

          <a href="/student/classes" className="exam-result-nav-link">
            My classes
          </a>

          <a href="/student/exams" className="exam-result-nav-link">
            Exams
          </a>

          <a href="/student/grades" className="exam-result-nav-link">
            My grades
          </a>

          <a
            href="/student/exam-history"
            className="exam-result-nav-link active"
          >
            Exam history
          </a>

          <a href="/student/settings" className="exam-result-nav-link">
            Settings
          </a>
        </nav>

        <div className="exam-result-sidebar-bottom">
          <button
            className="exam-result-sidebar-action"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light mode" : "Light / dark"}
          </button>

          <a
            href="/sign-in"
            className="exam-result-sidebar-action"
          >
            Sign out
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="exam-result-main">

        {/* PAGE HEADER */}
        <header className="exam-result-header">
          <div>
            <h1>{examTitle}</h1>
            <p>Result released</p>
          </div>

          <button
            className="exam-result-back-button"
            onClick={() => navigate("/student/exam-history")}
          >
            Back
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <section className="exam-result-summary">

          <div className="exam-result-stat-card">
            <span className="exam-result-stat-label">Score</span>
            <strong>
              {score} / {totalScore}
            </strong>
          </div>

          <div className="exam-result-stat-card">
            <span className="exam-result-stat-label">Percentage</span>
            <strong>{percentage}%</strong>
          </div>

          <div className="exam-result-stat-card">
            <span className="exam-result-stat-label">Manual grading</span>
            <strong>{manualGrading}</strong>
          </div>

        </section>

        {/* TEACHER FEEDBACK */}
        <section className="exam-result-feedback-card">
          <h2>Teacher feedback</h2>
          <p>{teacherFeedback}</p>
        </section>

        {/* ANSWER REVIEW */}
        <section className="exam-result-review-card">
          <h2>Answer review</h2>

          <div className="exam-result-table-wrapper">
            <table className="exam-result-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your answer</th>
                  <th>Result</th>
                </tr>
              </thead>

              <tbody>
                {answerReviews.map((answer) => (
                  <tr key={answer.id}>
                    <td>{answer.question}</td>

                    <td>{answer.answer}</td>

                    <td>
                      <span
                        className={`exam-result-status ${
                          answer.result === "Correct"
                            ? "answer-correct"
                            : "answer-incorrect"
                        }`}
                      >
                        <span className="exam-result-status-dot" />
                        {answer.result}
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
