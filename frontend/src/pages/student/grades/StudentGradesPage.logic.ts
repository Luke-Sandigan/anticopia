import { useState } from 'react'

export type GradeStatus = 'Final' | 'Provisional'
export interface Grade { id: number; subject: string; assessment: string; score: number; weight: number; status: GradeStatus }
export const grades: Grade[] = [
  { id: 1, subject: 'IT-201', assessment: 'Quiz 1', score: 80, weight: 20, status: 'Final' },
  { id: 2, subject: 'IT-201', assessment: 'Quiz 2', score: 90, weight: 20, status: 'Final' },
  { id: 3, subject: 'IT-201', assessment: 'Midterm', score: 85, weight: 30, status: 'Provisional' },
  { id: 4, subject: 'IT-305', assessment: 'Quiz 1', score: 92, weight: 25, status: 'Final' },
]
export const gradesNavigation = [
  { label: 'Dashboard', href: '/student/dashboard' },
  { label: 'My classes', href: '/student/classes' },
  { label: 'Exams', href: '/student/exams' },
  { label: 'My grades', href: '/student/grades' },
  { label: 'Exam history', href: '/student/exam-history' },
  { label: 'Settings', href: '/student/settings' },
]
export function useStudentGradesPageLogic() {
  const [darkMode, setDarkMode] = useState(false)
  return { darkMode, setDarkMode, currentGrade: 86 }
}
