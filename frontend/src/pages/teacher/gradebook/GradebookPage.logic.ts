import { useMemo, useState } from 'react'
import type { GradebookRow } from '../../../components/teacher/gradebook/GradebookTable'
import { computeWeighted, type CategoryKey, type GradeWeights } from '../../../lib/gradebook'

const initialWeights: GradeWeights = { quiz1: 20, quiz2: 20, midterm: 30, final: 30 }
const initialWeightInputs: Record<CategoryKey, string> = { quiz1: '20', quiz2: '20', midterm: '30', final: '30' }
export const gradebookRows: GradebookRow[] = [
  { id: 'maria-santos', studentName: 'Maria Santos', scores: { quiz1: { kind: 'score', value: 80 }, quiz2: { kind: 'score', value: 90 }, midterm: { kind: 'score', value: 85 }, final: { kind: 'missing' } } },
  { id: 'juan-dela-cruz', studentName: 'Juan dela Cruz', scores: { quiz1: { kind: 'score', value: 70 }, quiz2: { kind: 'excused' }, midterm: { kind: 'score', value: 74 }, final: { kind: 'missing' } } },
  { id: 'ana-reyes', studentName: 'Ana Reyes', scores: { quiz1: { kind: 'score', value: 92 }, quiz2: { kind: 'score', value: 88 }, midterm: { kind: 'missing' }, final: { kind: 'missing' } } },
  { id: 'carlo-mendoza', studentName: 'Carlo Mendoza', scores: { quiz1: { kind: 'score', value: 60 }, quiz2: { kind: 'score', value: 65 }, midterm: { kind: 'score', value: 67 }, final: { kind: 'missing' } } },
  { id: 'bea-lim', studentName: 'Bea Lim', scores: { quiz1: { kind: 'score', value: 95 }, quiz2: { kind: 'score', value: 97 }, midterm: { kind: 'score', value: 94 }, final: { kind: 'missing' } } },
  { id: 'paolo-garcia', studentName: 'Paolo Garcia', scores: { quiz1: { kind: 'missing' }, quiz2: { kind: 'score', value: 50 }, midterm: { kind: 'score', value: 58 }, final: { kind: 'missing' } } },
  { id: 'isa-navarro', studentName: 'Isa Navarro', scores: { quiz1: { kind: 'score', value: 85 }, quiz2: { kind: 'score', value: 80 }, midterm: { kind: 'score', value: 82 }, final: { kind: 'missing' } } },
  { id: 'miguel-tan', studentName: 'Miguel Tan', scores: { quiz1: { kind: 'score', value: 75 }, quiz2: { kind: 'score', value: 78 }, midterm: { kind: 'score', value: 79 }, final: { kind: 'missing' } } },
]

export function scoreLabel(row: GradebookRow, category: CategoryKey) {
  const score = row.scores[category]
  if (score.kind === 'missing') return 'Missing'
  if (score.kind === 'excused') return 'Excused'
  return String(score.value)
}

export function useGradebookPageLogic() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [weights, setWeights] = useState<GradeWeights>(initialWeights)
  const [weightInputs, setWeightInputs] = useState(initialWeightInputs)
  const [notice, setNotice] = useState('')
  const weightedGrades = useMemo(() => Object.fromEntries(gradebookRows.map((row) => [row.id, computeWeighted(row.scores, weights)])), [weights])

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function changeWeight(category: CategoryKey, value: string) {
    setWeightInputs((current) => ({ ...current, [category]: value }))
    const numericValue = Number(value)
    setWeights((current) => ({ ...current, [category]: value.trim() !== '' && Number.isFinite(numericValue) ? numericValue : 0 }))
  }
  function exportGrades() {
    const headers = ['Student', 'Quiz 1', 'Quiz 2', 'Midterm', 'Final', 'Weighted']
    const rows = gradebookRows.map((row) => [row.studentName, scoreLabel(row, 'quiz1'), scoreLabel(row, 'quiz2'), scoreLabel(row, 'midterm'), scoreLabel(row, 'final'), weightedGrades[row.id] === null ? '–' : `${weightedGrades[row.id]}%`])
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'gradebook-it-201.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setNotice('Gradebook exported as gradebook-it-201.csv.')
  }
  return { dark, weights, weightInputs, notice, weightedGrades, toggleTheme, changeWeight, exportGrades }
}
