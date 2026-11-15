import { useState } from 'react'

type AnswerStatus = 'Correct' | 'Incorrect'
export interface AnswerReview { id: number; question: string; answer: string; result: AnswerStatus }
export const answerReviews: AnswerReview[] = [
  { id: 1, question: 'Q1', answer: 'Array', result: 'Correct' },
  { id: 2, question: 'Q2', answer: 'FIFO', result: 'Incorrect' },
  { id: 3, question: 'Q3', answer: 'True', result: 'Correct' },
]

export function useStudentExamResultPageLogic() {
  const [darkMode, setDarkMode] = useState(false)
  const examTitle = 'Quiz 2: Arrays'
  const score = 17
  const totalScore = 20
  const percentage = Math.round((score / totalScore) * 100)
  const manualGrading = 'None'
  const teacherFeedback = 'Good work. Review how arrays resize in question 4.'
  return { darkMode, setDarkMode, examTitle, score, totalScore, percentage, manualGrading, teacherFeedback }
}
