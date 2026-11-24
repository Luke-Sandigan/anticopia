import { useState, type FormEvent } from 'react'
import type { Attempt } from './AttemptsTable'

export const ESSAY_MAX_MARKS = 10

export function useGradeEssayModalLogic(attempt: Attempt, onSave: (attemptId: string, marks: number, feedback: string) => void) {
  const [marks, setMarks] = useState(() => attempt.essayMarks?.toString() ?? (attempt.id === 'maria-santos' ? '7' : ''))
  const [feedback, setFeedback] = useState(attempt.feedback ?? '')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericMarks = Number(marks)
    if (marks.trim() === '' || !Number.isInteger(numericMarks) || numericMarks < 0 || numericMarks > ESSAY_MAX_MARKS) {
      setError(`Enter a whole number from 0 to ${ESSAY_MAX_MARKS}.`)
      return
    }
    onSave(attempt.id, numericMarks, feedback)
  }

  function handleMarksChange(value: string) {
    setMarks(value)
    setError('')
  }

  return { marks, feedback, error, handleSubmit, handleMarksChange, setFeedback }
}
