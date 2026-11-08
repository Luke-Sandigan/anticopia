import { useState } from 'react'
import type { ExamFormData } from '../../components/teacher/CreateExamDialog.logic'
import { starterClasses } from '../../data/teacherClasses'
import { starterExams, type Exam, type ExamStatus } from '../../data/teacherExams'

export function statusClass(status: ExamStatus): string {
  switch (status) {
    case 'Active': return 'active'
    case 'Scheduled': return 'scheduled'
    case 'Draft': return 'draft'
    case 'Closed': return 'closed'
    default: return ''
  }
}

export function useTeacherExamsPageLogic() {
  const [exams, setExams] = useState<Exam[]>(starterExams)
  const [showCreate, setShowCreate] = useState(false)
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function makeExam(data: ExamFormData, status: ExamStatus): Exam {
    const matchedClass = starterClasses.find((classItem) => classItem.id === data.classCode)
    const date = data.availableFrom ? new Date(data.availableFrom) : null
    const when = date ? `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : '—'
    return { id: `exam-${Date.now()}`, title: data.title, classCode: matchedClass?.name.split(' ')[0] ?? data.classCode, when, length: `${data.duration} min`, status }
  }
  function saveWithStatus(data: ExamFormData, status: ExamStatus, message: string) {
    setExams((previous) => [...previous, makeExam(data, status)])
    setNotice(message)
    setShowCreate(false)
  }
  function saveDraft(data: ExamFormData) { saveWithStatus(data, 'Draft', 'Exam saved as draft.') }
  function scheduleExam(data: ExamFormData) { saveWithStatus(data, 'Scheduled', 'Exam scheduled successfully.') }
  function publishExam(data: ExamFormData) { saveWithStatus(data, 'Active', 'Exam published and is now active.') }
  function duplicateExam(exam: Exam) {
    setExams((previous) => [...previous, { ...exam, id: `exam-${Date.now()}`, title: `${exam.title} (copy)`, status: 'Draft' }])
    setNotice(`Duplicated "${exam.title}" as a draft.`)
  }
  function archiveExam(exam: Exam) {
    setExams((previous) => previous.filter((item) => item.id !== exam.id))
    setNotice(`"${exam.title}" was archived.`)
  }

  return { exams, showCreate, setShowCreate, dark, notice, setNotice, toggleTheme, saveDraft, scheduleExam, publishExam, duplicateExam, archiveExam }
}
