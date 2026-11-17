import { useState } from 'react'

export const teacherDashboardStats = [
  { label: 'Classes', value: '3' },
  { label: 'Enrolled students', value: '100' },
  { label: 'Active exams', value: '1' },
  { label: 'Awaiting grading', value: '14' },
]

export function useTeacherDashboardPageLogic() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  return { dark, toggleTheme }
}
