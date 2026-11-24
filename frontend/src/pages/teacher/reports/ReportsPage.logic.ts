import { useState } from 'react'
import { assessmentAverages, completion, distributionBuckets } from './mockReportsData'

export const reportTypes = ['Grade report', 'Monitoring report', 'Exam activity report']
export { assessmentAverages, completion, distributionBuckets }

export function useReportsPageLogic() {
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
  function prepareReport(reportType: string) { setNotice(`${reportType} is being prepared.`) }
  return { dark, notice, completionPercent, toggleTheme, prepareReport }
}
