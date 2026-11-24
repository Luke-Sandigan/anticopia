import { DashboardSidebar } from '../../../components/teacher/DashboardSidebar'
import { CategoryWeights } from '../../../components/teacher/gradebook/CategoryWeights'
import { GradebookTable } from '../../../components/teacher/gradebook/GradebookTable'
import { SecondaryButton } from '../../../components/shared/Buttons'
import { gradebookRows, useGradebookPageLogic } from './GradebookPage.logic'

export function GradebookPage() {
  const { dark, weights, weightInputs, notice, weightedGrades, toggleTheme, changeWeight, exportGrades } = useGradebookPageLogic()

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
