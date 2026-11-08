import { useState, type FormEvent } from 'react'
import type { MonitoringEventKind } from '../../data/liveMonitoring'

export function eventClass(kind: MonitoringEventKind) {
  if (kind === 'Exam started') return 'started'
  if (kind === 'Copied text') return 'copied'
  if (kind === 'Connection lost') return 'offline'
  return 'tab'
}
export function eventLabel(kind: MonitoringEventKind, detail: string) { return kind === 'Exam started' ? kind : detail }

export function useTeacherStudentMonitoringPageLogic() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [decision, setDecision] = useState('')
  const [savedDecision, setSavedDecision] = useState(false)
  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function saveDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedDecision(true)
  }
  function updateDecision(value: string) { setDecision(value); setSavedDecision(false) }
  return { dark, decision, savedDecision, toggleTheme, saveDecision, updateDecision }
}
