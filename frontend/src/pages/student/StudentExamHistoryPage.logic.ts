import { useState } from 'react'

export type GradingStatus = 'Pending' | 'Released'
export interface PastExam { id: number; exam: string; date: string; submission: string; grading: GradingStatus }

export const pastExams: PastExam[] = [
  { id: 1, exam: 'Midterm: Data Structures', date: 'Today', submission: 'Submitted', grading: 'Pending' },
  { id: 2, exam: 'Quiz 2: Arrays', date: 'Oct 10', submission: 'Submitted', grading: 'Released' },
  { id: 3, exam: 'Quiz 1: Basics', date: 'Sep 26', submission: 'Submitted', grading: 'Released' },
]

export const examHistoryNavigation = [
  { label: 'Dashboard', href: '/student/dashboard' },
  { label: 'My classes', href: '/student/classes' },
  { label: 'Exams', href: '/student/exams' },
  { label: 'My grades', href: '/student/grades' },
  { label: 'Exam history', href: '/student/exam-history' },
  { label: 'Settings', href: '/student/settings' },
]

export function useStudentExamHistoryPageLogic() {
  const [darkMode, setDarkMode] = useState(false)
  const [selectedExam, setSelectedExam] = useState<PastExam | null>(null)
  return { darkMode, setDarkMode, selectedExam, setSelectedExam }
}
