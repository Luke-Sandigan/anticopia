import { useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { AccountSecurityCard } from '../../../components/settings/AccountSecurityCard'
import { ChangePasswordCard } from '../../../components/settings/ChangePasswordCard'
import { MonitoringPreferencesCard } from '../../../components/settings/MonitoringPreferencesCard'
import { NotificationPreferencesCard } from '../../../components/settings/NotificationPreferencesCard'
import { ProfileCard } from '../../../components/settings/ProfileCard'
import { initialProfile } from '../../../data/teacherSettings'

export function SettingsPage() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <div className={`teacher-dashboard !grid-cols-[240px_minmax(0,1fr)] max-[760px]:!grid-cols-1 ${dark ? 'theme-dark dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} />
      <main className="dashboard-main min-w-0 px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8">
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.04em] text-[#102d4b] dark:text-[#eaf2fb] sm:text-[32px]">Profile and settings</h1>
          <p className="mt-2 text-sm text-[#5f7690] dark:text-[#a3b7cf]">Manage your account.</p>
        </header>
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="lg:col-start-1 lg:row-start-1"><ProfileCard initialProfile={initialProfile} /></div>
          <div className="lg:col-start-2 lg:row-start-1"><ChangePasswordCard /></div>
          <div className="lg:col-start-1 lg:row-start-2"><NotificationPreferencesCard /></div>
          <div className="lg:col-start-2 lg:row-start-2"><MonitoringPreferencesCard /></div>
          <div className="lg:col-start-1 lg:row-start-3"><AccountSecurityCard /></div>
        </div>
      </main>
    </div>
  )
}
