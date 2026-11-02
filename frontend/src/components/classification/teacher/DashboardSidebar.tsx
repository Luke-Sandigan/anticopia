import { Link, NavLink } from 'react-router-dom'

const navigation = ['Dashboard', 'Classes', 'Exams', 'Question bank', 'Live monitoring', 'Grading', 'Gradebook', 'Reports', 'Settings']
type DashboardSidebarProps = { dark: boolean; onToggleTheme: () => void; activePage?: string }

export function DashboardSidebar({ dark, onToggleTheme }: DashboardSidebarProps) {
  const routes: Record<string, string | undefined> = {
    Dashboard: '/teacher/dashboard',
    Classes: '/teacher/classes',
    Exams: '/teacher/exams',
    'Question bank': '/teacher/question-bank',
    'Live monitoring': '/teacher/live-monitoring',
    Grading: '/grading',
    Gradebook: '/gradebook',
    Reports: '/reports',
    Settings: '/settings',
  }
  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" to="/teacher/dashboard" aria-label="Anticopia dashboard">
        <img src="/shield-check.svg" alt="" />
        <span>Anticopia</span>
      </Link>
      <nav className="dashboard-nav" aria-label="Teacher navigation">
        {navigation.map((item) => {
          const route = routes[item]
          return route
            ? <NavLink key={item} to={route} end={item !== 'Classes' && item !== 'Live monitoring'} className={({ isActive }) => isActive ? 'active' : ''}>{item}</NavLink>
            : <a key={item} href={item === 'Settings' ? '#overview' : '#summary'}>{item}</a>
        })}
      </nav>
      <div className="dashboard-sidebar-footer">
        <button type="button" onClick={onToggleTheme} aria-pressed={dark}>{dark ? 'Dark mode' : 'Light / dark'}</button>
        <Link to="/signin">Sign out</Link>
      </div>
    </aside>
  )
}
