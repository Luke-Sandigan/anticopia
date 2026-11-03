import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import './StudentDashboardPage.css'
import './StudentExamTakingPage.css'

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

  // Countdown timer
  useEffect(() => {
    if (submitted) return

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [submitted])

  // Record when the student switches away from the tab
  useEffect(() => {
    if (submitted) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setActivityEvents((previous) => previous + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [submitted])

  const current = questions[currentQuestion]

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const formattedTime =
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0')

  const selectAnswer = (optionIndex: number) => {
    if (submitted || timeLeft === 0) return

    setAnswers((previous) =>
      previous.map((answer, index) =>
        index === currentQuestion ? optionIndex : answer
      )
    )
  }

  const submitExam = () => {
    const unanswered = answers.filter((answer) => answer === null).length

    if (
      unanswered > 0 &&
      !window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?`
      )
    ) {
      return
    }

    setSubmitted(true)

    window.alert(
      'Exam submitted in this demo. Submission confirmation will be added in UI-17.'
    )
  }

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <h2 className="student-logo">♢ Anticopia</h2>

        <nav className="student-navigation">
          <NavLink to="/student/dashboard">Dashboard</NavLink>
          <NavLink to="/student/classes">My classes</NavLink>
          <NavLink to="/student/exam-taking" className="student-active">
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
        <header className="exam-taking-header">
          <h1>Midterm: Data Structures</h1>
          <p>Question {currentQuestion + 1} of {questions.length}</p>
        </header>

        <div className="exam-taking-content">
          <section className="exam-question-card">
            <h3>{current.question}</h3>

            <div className="exam-options">
              {current.options.map((option, index) => (
                <label
                  className={`exam-option ${
                    answers[currentQuestion] === index ? 'selected' : ''
                  }`}
                  key={option}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={answers[currentQuestion] === index}
                    onChange={() => selectAnswer(index)}
                    disabled={submitted || timeLeft === 0}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <div className="exam-question-footer">
              <button
                type="button"
                className="exam-nav-button"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((previous) => previous - 1)}
              >
                Previous
              </button>

              <button
                type="button"
                className="exam-nav-button"
                disabled={currentQuestion === questions.length - 1}
                onClick={() => setCurrentQuestion((previous) => previous + 1)}
              >
                Next
              </button>

              <span>
                {answers[currentQuestion] === null ? 'Not saved yet' : 'Answer selected'}
              </span>
            </div>
          </section>

          <aside className="exam-taking-sidebar">
            <section className="exam-timer-card">
              <h3>Time left</h3>
              <strong>{formattedTime}</strong>
            </section>

            <section className="exam-questions-card">
              <h3>Questions</h3>

              <div className="exam-question-numbers">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`exam-number-button ${
                      currentQuestion === index ? 'current' : ''
                    }`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              className="exam-submit-button"
              onClick={submitExam}
              disabled={submitted || timeLeft === 0}
            >
              {submitted ? 'Submitted' : 'Submit exam'}
            </button>

            <p className="exam-activity-count">
              Activity events recorded: {activityEvents}
            </p>
          </aside>
        </div>
      </main>
    </div>
  )
}