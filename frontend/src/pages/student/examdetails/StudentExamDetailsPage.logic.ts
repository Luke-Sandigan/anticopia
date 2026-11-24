import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'

export function useStudentExamDetailsPageLogic(navigate: NavigateFunction) {
  const [agreed, setAgreed] = useState(false)
  const [screenTested, setScreenTested] = useState(false)
  function startExam() {
    if (agreed) navigate('/student/exam-taking')
  }
  return { agreed, setAgreed, screenTested, testScreenSharing: () => setScreenTested(true), startExam }
}
