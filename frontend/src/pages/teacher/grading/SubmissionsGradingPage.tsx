import { DashboardSidebar } from '../../../components/teacher/DashboardSidebar'
import { AttemptsTable } from '../../../components/teacher/grading/AttemptsTable'
import { GradeEssayModal } from '../../../components/teacher/grading/GradeEssayModal'
import { PrimaryButton, SecondaryButton } from '../../../components/shared/Buttons'
import { Modal } from '../../../components/shared/Modal'
import { useSubmissionsGradingPageLogic } from './SubmissionsGradingPage.logic'

export function SubmissionsGradingPage() {
  const { dark, attempts, notice, setGradingAttemptId, releaseOpen, setReleaseOpen, released, gradingAttempt, toggleTheme, saveMarks, confirmRelease } = useSubmissionsGradingPageLogic()

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
            disabled={released}
            onClick={() => setReleaseOpen(true)}
            className="min-h-11 rounded-xl bg-[#2d76bf] px-5 text-sm font-semibold text-white transition hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25 disabled:cursor-not-allowed disabled:bg-[#9bb9d6] disabled:hover:bg-[#9bb9d6]"
          >
            {released ? 'Grades released' : 'Release grades'}
          </button>
        </header>
        {notice && <p role="status" className="mb-5 text-sm text-[#376b4e] dark:text-[#9bd1ae]">{notice}</p>}
        <section className="overflow-hidden rounded-2xl border border-[#d5e0ec] bg-white shadow-[0_8px_24px_rgba(16,45,75,0.04)] dark:border-[#344964] dark:bg-[#172942]" aria-labelledby="attempts-heading">
          <div className="border-b border-[#e7edf4] px-5 py-5 dark:border-[#344964] sm:px-6">
            <h2 id="attempts-heading" className="text-xl font-bold tracking-[-0.025em] text-[#102d4b] dark:text-[#eaf2fb]">Attempts</h2>
          </div>
          <AttemptsTable attempts={attempts} onGrade={setGradingAttemptId} />
        </section>
      </main>
      {gradingAttempt && (
        <GradeEssayModal
          key={gradingAttempt.id}
          attempt={gradingAttempt}
          onClose={() => setGradingAttemptId(null)}
          onSave={saveMarks}
        />
      )}
      <Modal open={releaseOpen} onClose={() => setReleaseOpen(false)} title="Release grades?" titleId="release-grades-title">
        <div className="mt-5">
          <p className="text-base text-[#102d4b]">Students will see their scores and feedback.</p>
          <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <SecondaryButton type="button" onClick={() => setReleaseOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="button" onClick={confirmRelease}>Release</PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
