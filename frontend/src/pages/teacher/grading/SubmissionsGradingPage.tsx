import { useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { AttemptsTable, type Attempt } from '../../../components/grading/AttemptsTable'

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

export function SubmissionsGradingPage() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')
  const needsGrading = mockAttempts.some((attempt) => attempt.essayStatus === 'needs_grading')

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function releaseGrades() {
    setNotice('Grades have been released to students.')
  }

  return (
    <div className={`teacher-dashboard !grid-cols-[240px_minmax(0,1fr)] max-[760px]:!grid-cols-1 ${dark ? 'theme-dark dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main min-w-0 px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.04em] text-[#102d4b] dark:text-[#eaf2fb] sm:text-[32px]">Submissions and grading</h1>
            <p className="mt-2 text-sm text-[#5f7690] dark:text-[#a3b7cf]">Midterm: Data Structures</p>
          </div>
          <button
            type="button"
            disabled={needsGrading}
            title={needsGrading ? 'Grade all essays before releasing grades.' : undefined}
            onClick={releaseGrades}
            className="min-h-11 rounded-xl bg-[#2d76bf] px-5 text-sm font-semibold text-white transition hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25 disabled:cursor-not-allowed disabled:bg-[#9bb9d6] disabled:hover:bg-[#9bb9d6]"
          >
            Release grades
          </button>
        </header>
        {notice && <p role="status" className="mb-5 text-sm text-[#376b4e] dark:text-[#9bd1ae]">{notice}</p>}
        <section className="overflow-hidden rounded-2xl border border-[#d5e0ec] bg-white shadow-[0_8px_24px_rgba(16,45,75,0.04)] dark:border-[#344964] dark:bg-[#172942]" aria-labelledby="attempts-heading">
          <div className="border-b border-[#e7edf4] px-5 py-5 dark:border-[#344964] sm:px-6">
            <h2 id="attempts-heading" className="text-xl font-bold tracking-[-0.025em] text-[#102d4b] dark:text-[#eaf2fb]">Attempts</h2>
          </div>
          <AttemptsTable attempts={mockAttempts} />
        </section>
      </main>
    </div>
  )
}
