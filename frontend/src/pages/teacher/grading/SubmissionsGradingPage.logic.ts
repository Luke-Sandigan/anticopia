import { useState } from 'react'
import type { Attempt } from '../../../components/teacher/grading/AttemptsTable'

const mockAttempts: Attempt[] = [
  { id: 'maria-santos', studentName: 'Maria Santos', status: 'submitted', autoScore: 18, totalPoints: 24, essayStatus: 'needs_grading' },
  { id: 'juan-dela-cruz', studentName: 'Juan dela Cruz', status: 'submitted', autoScore: 19, totalPoints: 24, essayStatus: 'needs_grading' },
  { id: 'ana-reyes', studentName: 'Ana Reyes', status: 'submitted', autoScore: 20, totalPoints: 24, essayStatus: 'needs_grading' },
  { id: 'carlo-mendoza', studentName: 'Carlo Mendoza', status: 'submitted', autoScore: 21, totalPoints: 24, essayStatus: 'graded' },
  { id: 'bea-lim', studentName: 'Bea Lim', status: 'submitted', autoScore: 22, totalPoints: 24, essayStatus: 'graded' },
  { id: 'paolo-garcia', studentName: 'Paolo Garcia', status: 'missing', autoScore: null, totalPoints: 24, essayStatus: null },
  { id: 'isa-navarro', studentName: 'Isa Navarro', status: 'submitted', autoScore: null, totalPoints: 24, essayStatus: null },
  { id: 'miguel-tan', studentName: 'Miguel Tan', status: 'in_progress', autoScore: null, totalPoints: 24, essayStatus: null },
]

export function useSubmissionsGradingPageLogic() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [attempts, setAttempts] = useState<Attempt[]>(mockAttempts)
  const [notice, setNotice] = useState('')
  const [gradingAttemptId, setGradingAttemptId] = useState<string | null>(null)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [released, setReleased] = useState(false)
  const gradingAttempt = attempts.find((attempt) => attempt.id === gradingAttemptId)
  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function saveMarks(attemptId: string, essayMarks: number, feedback: string) {
    const attempt = attempts.find((item) => item.id === attemptId)
    setAttempts((current) => current.map((item) => item.id === attemptId ? { ...item, essayStatus: 'graded', essayMarks, feedback } : item))
    setGradingAttemptId(null)
    setNotice(`Saved marks for ${attempt?.studentName ?? 'student'}.`)
  }
  function confirmRelease() {
    setReleased(true)
    setReleaseOpen(false)
    setNotice('Grades released to students.')
  }
  return { dark, attempts, notice, gradingAttemptId, setGradingAttemptId, releaseOpen, setReleaseOpen, released, gradingAttempt, toggleTheme, saveMarks, confirmRelease }
}
