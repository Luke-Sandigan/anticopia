const navigation = ['Dashboard', 'Classes', 'Exams', 'Question bank', 'Live monitoring', 'Grading', 'Gradebook', 'Reports', 'Settings']
type DashboardSidebarProps = { dark: boolean; onToggleTheme: () => void; activePage?: string }

export function DashboardSidebar({ dark, onToggleTheme, activePage = 'Dashboard' }: DashboardSidebarProps) {

  return (
    <aside className="dashboard-sidebar">
      <a className="dashboard-brand" href="/teacher/dashboard" aria-label="Anticopia dashboard">
        <img src="/anticopia-logo.png" alt="" />
        <span>Anticopia</span>
      </a>
      <nav className="dashboard-nav" aria-label="Teacher navigation">
        {navigation.map((item) => (
          <a key={item} className={item === activePage ? 'active' : ''} aria-current={item === activePage ? 'page' : undefined} href={item === 'Dashboard' ? '/teacher/dashboard' : item === 'Classes' ? '/teacher/classes' : item === 'Exams' ? '#exams' : item === 'Question bank' || item === 'Live monitoring' ? '#exams' : item === 'Grading' || item === 'Gradebook' || item === 'Reports' ? '#summary' : '#overview'}>{item}</a>
        ))}
      </nav>
      <div className="dashboard-sidebar-footer">
        <button type="button" onClick={onToggleTheme} aria-pressed={dark}>{dark ? 'Dark mode' : 'Light / dark'}</button>
        <a href="/signin">Sign out</a>
      </div>
    </aside>
  )
}
