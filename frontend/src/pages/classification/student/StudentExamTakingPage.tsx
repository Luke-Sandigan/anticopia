import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import './StudentDashboardPage.css'
import './StudentExamTakingPage.css'
import './StudentSubmissionConfirmation.css'

// Exam Questions
const questions = [
  {
    question: 'Which structure gives O(1) access by index?',
    options: ['Linked list', 'Array', 'Queue', 'Tree'],
    correct: 1,
  },
  {
    question: 'Which data structure follows FIFO?',
    options: ['Stack', 'Tree', 'Queue', 'Graph'],
    correct: 2,
  },
  {
    question: 'Which data structure follows LIFO?',
    options: ['Queue', 'Array', 'Stack', 'Linked list'],
    correct: 2,
  },
]

export function StudentExamTakingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  )

  const [timeLeft, setTimeLeft] = useState(90 * 60)

  const [activityEvents, setActivityEvents] = useState(0)

  const [submitted, setSubmitted] = useState(false)

  // UI-17: Controls the confirmation popup
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Countdown Timer
  useEffect(() => {
    if (submitted) return

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [submitted])

  // Browser Tab-Switch Detection
  useEffect(() => {
    if (submitted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setActivityEvents((previous) => previous + 1)
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [submitted])

  // Current Question
  const current = questions[currentQuestion]

  // Format Timer
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const formattedTime =
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0')

  // Count Answered Questions
  const answeredCount = answers.filter(
    (answer) => answer !== null
  ).length

  // Select Answer
  const selectAnswer = (optionIndex: number) => {
    if (submitted || timeLeft === 0) return

    setAnswers((previous) =>
      previous.map((answer, index) =>
        index === currentQuestion ? optionIndex : answer
      )
    )
  }

  // Open UI-17 Confirmation Popup
  const submitExam = () => {
    setShowSubmitModal(true)
  }

  // Confirm Exam Submission
  const confirmSubmission = () => {
    setSubmitted(true)
    setShowSubmitModal(false)
  }

  // Cancel Exam Submission
  const cancelSubmission = () => {
    setShowSubmitModal(false)
  }

  return (
    <div className="student-layout">

      {/* Student Sidebar */}
      <aside className="student-sidebar">
        <h2 className="student-logo">♢ Anticopia</h2>

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

          <a href="#grades">My grades</a>
          <a href="#history">Exam history</a>
          <a href="#settings">Settings</a>
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
            Question {currentQuestion + 1} of {questions.length}
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
                  currentQuestion === questions.length - 1
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
                {questions.map((_, index) => (
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
              You answered {answeredCount} of {questions.length}.
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