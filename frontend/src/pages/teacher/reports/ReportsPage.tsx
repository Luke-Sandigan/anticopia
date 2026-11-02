import { useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { AverageRow } from '../../../components/reports/AverageRow'
import { DistributionChart } from '../../../components/reports/DistributionChart'
import { ProgressBar } from '../../../components/reports/ProgressBar'
import { ReportCard } from '../../../components/reports/ReportCard'
import { SecondaryButton } from '../../../components/ui/Buttons'
import { assessmentAverages, completion, distributionBuckets } from './mockReportsData'

const reportTypes = ['Grade report', 'Monitoring report', 'Exam activity report']

export function ReportsPage() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')
  const completionPercent = completion.total === 0 ? 0 : (completion.submitted / completion.total) * 100

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function prepareReport(reportType: string) {
    // TODO: call API to generate and download the selected report.
    setNotice(`${reportType} is being prepared.`)
  }

  return (
    <div className={`teacher-dashboard !grid-cols-[240px_minmax(0,1fr)] max-[760px]:!grid-cols-1 ${dark ? 'theme-dark dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main min-w-0 px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8">
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.04em] text-[#102d4b] dark:text-[#eaf2fb] sm:text-[32px]">Reports and analytics</h1>
          <p className="mt-2 text-sm text-[#5f7690] dark:text-[#a3b7cf]">IT-201 Data Structures</p>
        </header>
        {notice && <p role="status" className="mb-5 text-sm text-[#376b4e]">{notice}</p>}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportCard title="Average by assessment">
            <div className="space-y-5">
              {assessmentAverages.map((assessment) => <AverageRow key={assessment.id} assessment={assessment} />)}
            </div>
          </ReportCard>
          <ReportCard title="Score distribution">
            <DistributionChart buckets={distributionBuckets} />
            <table className="sr-only">
              <caption>Score distribution by bucket</caption>
              <thead><tr><th scope="col">Score bucket</th><th scope="col">Students</th></tr></thead>
              <tbody>{distributionBuckets.map((bucket) => <tr key={bucket.label}><th scope="row">{bucket.label}</th><td>{bucket.count}</td></tr>)}</tbody>
            </table>
          </ReportCard>
          <ReportCard title="Completion">
            <div>
              <div className="mb-3 text-sm font-medium text-[#102d4b] dark:text-[#eaf2fb]">Submission rate</div>
              <ProgressBar percent={completionPercent} label="Midterm submission rate" size="medium" />
              <p className="mt-3 text-xs text-[#5f7690] dark:text-[#a3b7cf]">{completion.submitted} of {completion.total} students submitted the midterm.</p>
            </div>
          </ReportCard>
          <ReportCard title="Export">
            <div className="flex flex-wrap gap-3">
              {reportTypes.map((reportType) => (
                <SecondaryButton key={reportType} type="button" onClick={() => prepareReport(reportType)}>
                  {reportType}
                </SecondaryButton>
              ))}
            </div>
          </ReportCard>
        </div>
      </main>
    </div>
  )
}
