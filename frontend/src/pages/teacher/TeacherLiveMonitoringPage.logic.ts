import { useState } from 'react'
import type { StudentStatus } from '../../data/liveMonitoring'

export function statusClass(status: StudentStatus) { return status.toLowerCase().replace(' ', '-') }
export function alertClass(kind: 'Left tab' | 'Copied text') { return kind === 'Copied text' ? 'copied' : 'tab' }

export function useTeacherLiveMonitoringPageLogic() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [sessionActive, setSessionActive] = useState(true)
  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function endSession() { setSessionActive(false) }
  return { dark, sessionActive, toggleTheme, endSession }
}
