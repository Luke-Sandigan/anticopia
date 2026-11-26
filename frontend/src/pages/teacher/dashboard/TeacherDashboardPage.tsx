import { DashboardSidebar } from '../../../components/teacher/DashboardSidebar'
import { DashboardStatCard } from '../../../components/teacher/DashboardStatCard'
import { ExamSummaryPanel } from '../../../components/teacher/ExamSummaryPanel'
import { MyClassesPanel } from '../../../components/teacher/MyClassesPanel'
import { RecentAlertsPanel } from '../../../components/teacher/RecentAlertsPanel'
import { UpcomingExamsPanel } from '../../../components/teacher/UpcomingExamsPanel'
import { teacherDashboardStats, useTeacherDashboardPageLogic } from './TeacherDashboardPage.logic'

export function TeacherDashboardPage() {
  const { dark, toggleTheme, dashboard, error, retry } = useTeacherDashboardPageLogic()

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <h1>{dashboard ? `Welcome, ${dashboard.teacherName}` : 'Teacher dashboard'}</h1>
          <p>Here is what needs you today.</p>
        </header>
        {error && <div className="dashboard-panel" role="alert">
          <p>Could not load the dashboard. {error}</p>
          <button type="button" className="table-action primary" onClick={retry}>Try again</button>
        </div>}
        {!dashboard && !error && <p role="status">Loading dashboard…</p>}
        {dashboard && <>
          <section className="dashboard-stats" aria-label="Teaching overview">
            {teacherDashboardStats(dashboard.stats).map((stat) => <DashboardStatCard key={stat.label} {...stat} />)}
          </section>
          <div className="dashboard-top-grid">
            <UpcomingExamsPanel exams={dashboard.exams} />
            <RecentAlertsPanel alerts={dashboard.alerts} />
          </div>
          <ExamSummaryPanel summary={dashboard.summary} />
          <MyClassesPanel classes={dashboard.classes} />
        </>}
      </main>
    </div>
  )
}
