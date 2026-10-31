import { useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { DashboardStatCard } from '../../../components/classification/teacher/DashboardStatCard'
import { ExamSummaryPanel } from '../../../components/classification/teacher/ExamSummaryPanel'
import { MyClassesPanel } from '../../../components/classification/teacher/MyClassesPanel'
import { RecentAlertsPanel } from '../../../components/classification/teacher/RecentAlertsPanel'
import { UpcomingExamsPanel } from '../../../components/classification/teacher/UpcomingExamsPanel'

const stats = [
  { label: 'Classes', value: '3' },
  { label: 'Enrolled students', value: '100' },
  { label: 'Active exams', value: '1' },
  { label: 'Awaiting grading', value: '14' },
]

export function TeacherDashboardPage() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main" id="overview">
        <header className="dashboard-header"><h1>Good morning, Ms. Rivera</h1><p>Here is what needs you today.</p></header>
        <section className="dashboard-stats" aria-label="Teaching overview">{stats.map((stat) => <DashboardStatCard key={stat.label} {...stat} />)}</section>
        <div className="dashboard-top-grid"><UpcomingExamsPanel /><RecentAlertsPanel /></div>
        <ExamSummaryPanel />
        <MyClassesPanel />
        <p className="placeholder-note">Sample dashboard data for preview</p>
      </main>
    </div>
  )
}
