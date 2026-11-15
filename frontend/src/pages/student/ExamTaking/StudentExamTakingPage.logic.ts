import { useEffect, useState } from 'react'

export const examQuestions = [
  { question: 'Which structure gives O(1) access by index?', options: ['Linked list', 'Array', 'Queue', 'Tree'], correct: 1 },
  { question: 'Which data structure follows FIFO?', options: ['Stack', 'Tree', 'Queue', 'Graph'], correct: 2 },
  { question: 'Which data structure follows LIFO?', options: ['Queue', 'Array', 'Stack', 'Linked list'], correct: 2 },
]

export function useStudentExamTakingPageLogic() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(examQuestions.length).fill(null))
  const [timeLeft, setTimeLeft] = useState(90 * 60)
  const [activityEvents, setActivityEvents] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  useEffect(() => {
    if (submitted) return
    const timer = window.setInterval(() => setTimeLeft((previous) => Math.max(0, previous - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [submitted])

  useEffect(() => {
    if (submitted) return
    const handleVisibilityChange = () => {
      if (document.hidden) setActivityEvents((previous) => previous + 1)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [submitted])

  const current = examQuestions[currentQuestion]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
  const answeredCount = answers.filter((answer) => answer !== null).length

  function selectAnswer(optionIndex: number) {
    if (submitted || timeLeft === 0) return
    setAnswers((previous) => previous.map((answer, index) => index === currentQuestion ? optionIndex : answer))
  }
  function submitExam() { setShowSubmitModal(true) }
  function confirmSubmission() { setSubmitted(true); setShowSubmitModal(false) }
  function cancelSubmission() { setShowSubmitModal(false) }

  return { currentQuestion, setCurrentQuestion, answers, timeLeft, activityEvents, submitted, showSubmitModal, current, formattedTime, answeredCount, selectAnswer, submitExam, confirmSubmission, cancelSubmission }
}
