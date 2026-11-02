import { useMemo, useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { CategoryWeights } from '../../../components/gradebook/CategoryWeights'
import { GradebookTable, type GradebookRow } from '../../../components/gradebook/GradebookTable'
import { SecondaryButton } from '../../../components/ui/Buttons'
import { computeWeighted, type CategoryKey, type GradeWeights } from '../../../lib/gradebook'

const initialWeights: GradeWeights = { quiz1: 20, quiz2: 20, midterm: 30, final: 30 }
const initialWeightInputs: Record<CategoryKey, string> = { quiz1: '20', quiz2: '20', midterm: '30', final: '30' }

const gradebookRows: GradebookRow[] = [
  { id: 'maria-santos', studentName: 'Maria Santos', scores: { quiz1: { kind: 'score', value: 80 }, quiz2: { kind: 'score', value: 90 }, midterm: { kind: 'score', value: 85 }, final: { kind: 'missing' } } },
  { id: 'juan-dela-cruz', studentName: 'Juan dela Cruz', scores: { quiz1: { kind: 'score', value: 70 }, quiz2: { kind: 'excused' }, midterm: { kind: 'score', value: 74 }, final: { kind: 'missing' } } },
  { id: 'ana-reyes', studentName: 'Ana Reyes', scores: { quiz1: { kind: 'score', value: 92 }, quiz2: { kind: 'score', value: 88 }, midterm: { kind: 'missing' }, final: { kind: 'missing' } } },
  { id: 'carlo-mendoza', studentName: 'Carlo Mendoza', scores: { quiz1: { kind: 'score', value: 60 }, quiz2: { kind: 'score', value: 65 }, midterm: { kind: 'score', value: 67 }, final: { kind: 'missing' } } },
  { id: 'bea-lim', studentName: 'Bea Lim', scores: { quiz1: { kind: 'score', value: 95 }, quiz2: { kind: 'score', value: 97 }, midterm: { kind: 'score', value: 94 }, final: { kind: 'missing' } } },
  { id: 'paolo-garcia', studentName: 'Paolo Garcia', scores: { quiz1: { kind: 'missing' }, quiz2: { kind: 'score', value: 50 }, midterm: { kind: 'score', value: 58 }, final: { kind: 'missing' } } },
  { id: 'isa-navarro', studentName: 'Isa Navarro', scores: { quiz1: { kind: 'score', value: 85 }, quiz2: { kind: 'score', value: 80 }, midterm: { kind: 'score', value: 82 }, final: { kind: 'missing' } } },
  { id: 'miguel-tan', studentName: 'Miguel Tan', scores: { quiz1: { kind: 'score', value: 75 }, quiz2: { kind: 'score', value: 78 }, midterm: { kind: 'score', value: 79 }, final: { kind: 'missing' } } },
]

function scoreLabel(row: GradebookRow, category: CategoryKey) {
  const score = row.scores[category]
  if (score.kind === 'missing') return 'Missing'
  if (score.kind === 'excused') return 'Excused'
  return String(score.value)
}

export function GradebookPage() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [weights, setWeights] = useState<GradeWeights>(initialWeights)
  const [weightInputs, setWeightInputs] = useState(initialWeightInputs)
  const [notice, setNotice] = useState('')

  const weightedGrades = useMemo(
    () => Object.fromEntries(gradebookRows.map((row) => [row.id, computeWeighted(row.scores, weights)])),
    [weights],
  )

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
    // TODO: call API when persistence for grade weights is available.
  }

  function exportGrades() {
    const headers = ['Student', 'Quiz 1', 'Quiz 2', 'Midterm', 'Final', 'Weighted']
    const rows = gradebookRows.map((row) => [
      row.studentName,
      scoreLabel(row, 'quiz1'),
      scoreLabel(row, 'quiz2'),
      scoreLabel(row, 'midterm'),
      scoreLabel(row, 'final'),
      weightedGrades[row.id] === null ? '–' : `${weightedGrades[row.id]}%`,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
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

  return (
    <div className={`teacher-dashboard !grid-cols-[240px_minmax(0,1fr)] max-[760px]:!grid-cols-1 ${dark ? 'theme-dark dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main min-w-0 px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8">
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.04em] text-[#102d4b] dark:text-[#eaf2fb] sm:text-[32px]">Gradebook</h1>
          <p className="mt-2 text-sm text-[#5f7690] dark:text-[#a3b7cf]">IT-201 Data Structures · weighted grades</p>
        </header>
        {notice && <p role="status" className="mb-5 text-sm text-[#376b4e]">{notice}</p>}
        <section className="mb-6 rounded-2xl border border-[#d5e0ec] bg-white p-5 shadow-[0_8px_24px_rgba(16,45,75,0.04)] sm:p-6" aria-labelledby="weights-heading">
          <h2 id="weights-heading" className="mb-5 text-xl font-bold tracking-[-0.025em] text-[#102d4b]">Categories and weights</h2>
          <CategoryWeights inputValues={weightInputs} weights={weights} onChange={changeWeight} />
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#d5e0ec] bg-white shadow-[0_8px_24px_rgba(16,45,75,0.04)]" aria-labelledby="scores-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7edf4] px-5 py-4 sm:px-6">
            <h2 id="scores-heading" className="text-xl font-bold tracking-[-0.025em] text-[#102d4b]">Scores</h2>
            <SecondaryButton type="button" onClick={exportGrades} className="!h-10 !px-4">Export grades</SecondaryButton>
          </div>
          <GradebookTable rows={gradebookRows} weightedGrades={weightedGrades} />
        </section>
      </main>
    </div>
  )
}
