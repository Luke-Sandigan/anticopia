import { NavLink } from 'react-router-dom'
import { examQuestions, useStudentExamTakingPageLogic } from './StudentExamTakingPage.logic'

export function StudentExamTakingPage() {
  const { currentQuestion, setCurrentQuestion, answers, timeLeft, activityEvents, submitted, showSubmitModal, current, formattedTime, answeredCount, selectAnswer, submitExam, confirmSubmission, cancelSubmission } = useStudentExamTakingPageLogic()

  return (
    <div className="student-layout">

      {/* Student Sidebar */}
      <aside className="student-sidebar">
        <h2 className="student-logo"><img src="/anticopia-logo.png" alt="" />Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/student/classes">
            My classes
          </NavLink>

          <NavLink
            to="/student/exam-taking"
            className="student-active"
          >
            Exams
          </NavLink>

          <NavLink to="/student/grades">My grades</NavLink>
          <NavLink to="/student/exam-history">Exam history</NavLink>
          <NavLink to="/student/settings">Settings</NavLink>
        </nav>

        <div className="student-sidebar-bottom">
          <span>Light / dark</span>
          <NavLink to="/signin">Sign out</NavLink>
        </div>
      </aside>

      {/* Main Exam Content */}
      <main className="student-main">

        {/* Exam Header */}
        <header className="exam-taking-header">
          <h1>Midterm: Data Structures</h1>

          <p>
            Question {currentQuestion + 1} of {examQuestions.length}
          </p>
        </header>

        <div className="exam-taking-content">

          {/* Question Card */}
          <section className="exam-question-card">
            <h3>{current.question}</h3>

            {/* Multiple Choice Answers */}
            <div className="exam-options">
              {current.options.map((option, index) => (
                <label
                  key={option}
                  className={`exam-option ${
                    answers[currentQuestion] === index
                      ? 'selected'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={
                      answers[currentQuestion] === index
                    }
                    onChange={() => selectAnswer(index)}
                    disabled={submitted || timeLeft === 0}
                  />

                  <span>{option}</span>
                </label>
              ))}
            </div>

            {/* Previous / Next Navigation */}
            <div className="exam-question-footer">

              <button
                type="button"
                className="exam-nav-button"
                disabled={currentQuestion === 0}
                onClick={() =>
                  setCurrentQuestion(
                    (previous) => previous - 1
                  )
                }
              >
                Previous
              </button>

              <button
                type="button"
                className="exam-nav-button"
                disabled={
                  currentQuestion === examQuestions.length - 1
                }
                onClick={() =>
                  setCurrentQuestion(
                    (previous) => previous + 1
                  )
                }
              >
                Next
              </button>

              <span>
                {answers[currentQuestion] === null
                  ? 'Not saved yet'
                  : 'Answer selected'}
              </span>
            </div>
          </section>

          {/* Right Side Panel */}
          <aside className="exam-taking-sidebar">

            {/* Countdown Timer */}
            <section className="exam-timer-card">
              <h3>Time left</h3>

              <strong>{formattedTime}</strong>
            </section>

            {/* Question Navigation */}
            <section className="exam-questions-card">
              <h3>Questions</h3>

              <div className="exam-question-numbers">
            {examQuestions.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`exam-number-button ${
                      currentQuestion === index
                        ? 'current'
                        : ''
                    }`}
                    onClick={() =>
                      setCurrentQuestion(index)
                    }
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </section>

            {/* Submit Exam Button */}
            <button
              type="button"
              className="exam-submit-button"
              onClick={submitExam}
              disabled={submitted || timeLeft === 0}
            >
              {submitted ? 'Submitted' : 'Submit exam'}
            </button>

            {/* Browser Activity Monitoring */}
            <p className="exam-activity-count">
              Activity events recorded: {activityEvents}
            </p>

          </aside>
        </div>
      </main>

      {/* UI-17: Submission Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="submission-modal-overlay"
          onClick={cancelSubmission}
        >
          <div
            className="submission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Modal Title */}
            <h2 id="submission-modal-title">
              Submit exam?
            </h2>

            {/* Modal Message */}
            <p>
              You answered {answeredCount} of {examQuestions.length}.
              {' '}You cannot change answers after submitting.
            </p>

            {/* Modal Buttons */}
            <div className="submission-modal-actions">

              <button
                type="button"
                className="submission-cancel-button"
                onClick={cancelSubmission}
              >
                Cancel
              </button>

              <button
                type="button"
                className="submission-confirm-button"
                onClick={confirmSubmission}
              >
                Submit
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
