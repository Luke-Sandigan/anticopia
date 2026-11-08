import { DashboardSidebar } from '../../components/teacher/DashboardSidebar'
import { DashboardStatCard } from '../../components/teacher/DashboardStatCard'
import { ExamSummaryPanel } from '../../components/teacher/ExamSummaryPanel'
import { MyClassesPanel } from '../../components/teacher/MyClassesPanel'
import { RecentAlertsPanel } from '../../components/teacher/RecentAlertsPanel'
import { UpcomingExamsPanel } from '../../components/teacher/UpcomingExamsPanel'
import { teacherDashboardStats, useTeacherDashboardPageLogic } from './TeacherDashboardPage.logic'

export function TeacherDashboardPage() {
  const { dark, toggleTheme } = useTeacherDashboardPageLogic()

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main" id="overview">
        <header className="dashboard-header"><h1>Good morning, Ms. Rivera</h1><p>Here is what needs you today.</p></header>
        <section className="dashboard-stats" aria-label="Teaching overview">{teacherDashboardStats.map((stat) => <DashboardStatCard key={stat.label} {...stat} />)}</section>
        <div className="dashboard-top-grid"><UpcomingExamsPanel /><RecentAlertsPanel /></div>
        <ExamSummaryPanel />
        <MyClassesPanel />
        <p className="placeholder-note">Sample dashboard data for preview</p>
      </main>
    </div>
  )
}
