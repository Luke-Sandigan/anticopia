export type ExamStatus = 'Active' | 'Scheduled' | 'Draft' | 'Closed'

export interface Exam {
  id: string
  title: string
  classCode: string
  when: string
  length: string
  status: ExamStatus
}

export const starterExams: Exam[] = [
  { id: 'exam-1', title: 'Midterm: Data Structures', classCode: 'IT-201', when: 'Today, 10:00', length: '90 min', status: 'Active' },
  { id: 'exam-2', title: 'Quiz 3: SQL Joins', classCode: 'IT-305', when: 'Oct 22, 14:00', length: '30 min', status: 'Scheduled' },
  { id: 'exam-3', title: 'Finals: Intro to Programming', classCode: 'IT-110', when: 'Dec 10, 09:00', length: '120 min', status: 'Draft' },
  { id: 'exam-4', title: 'Quiz 2: Arrays', classCode: 'IT-201', when: 'Oct 10, 10:00', length: '20 min', status: 'Closed' },
]
