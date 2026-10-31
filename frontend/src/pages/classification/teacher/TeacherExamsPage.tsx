import { useState } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { CreateExamDialog, type ExamFormData } from '../../../components/classification/teacher/CreateExamDialog'
import { starterExams, type Exam, type ExamStatus } from '../../../data/teacherExams'
import { starterClasses } from '../../../data/teacherClasses'

function statusClass(status: ExamStatus): string {
  switch (status) {
    case 'Active': return 'active'
    case 'Scheduled': return 'scheduled'
    case 'Draft': return 'draft'
    case 'Closed': return 'closed'
    default: return ''
  }
}

export function TeacherExamsPage() {
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
    const matchedClass = starterClasses.find((c) => c.id === data.classCode)
    return {
      id: `exam-${Date.now()}`,
      title: data.title,
      classCode: matchedClass?.name.split(' ')[0] ?? data.classCode,
      when: data.availableFrom ? new Date(data.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(data.availableFrom).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
      length: `${data.duration} min`,
      status,
    }
  }

  function saveDraft(data: ExamFormData) {
    setExams((prev) => [...prev, makeExam(data, 'Draft')])
    setNotice('Exam saved as draft.')
    setShowCreate(false)
  }

  function scheduleExam(data: ExamFormData) {
    setExams((prev) => [...prev, makeExam(data, 'Scheduled')])
    setNotice('Exam scheduled successfully.')
    setShowCreate(false)
  }

  function publishExam(data: ExamFormData) {
    setExams((prev) => [...prev, makeExam(data, 'Active')])
    setNotice('Exam published and is now active.')
    setShowCreate(false)
  }

  function duplicateExam(exam: Exam) {
    setExams((prev) => [...prev, { ...exam, id: `exam-${Date.now()}`, title: `${exam.title} (copy)`, status: 'Draft' }])
    setNotice(`Duplicated "${exam.title}" as a draft.`)
  }

  function archiveExam(exam: Exam) {
    setExams((prev) => prev.filter((e) => e.id !== exam.id))
    setNotice(`"${exam.title}" was archived.`)
  }

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} activePage="Exams" />
      <main className="dashboard-main classes-main">
        <header className="classes-header">
          <div>
            <h1>Exams</h1>
            <p>Create, schedule, and manage exams.</p>
          </div>
          <button type="button" className="class-button primary create-class-button" onClick={() => setShowCreate(true)}>Create exam</button>
        </header>

        {notice && <p className="class-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></p>}

        <section className="dashboard-panel exams-manage-panel" aria-label="All exams">
          <h2>All exams</h2>
          <div className="table-scroll">
            <table className="exams-manage-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Class</th>
                  <th>When</th>
                  <th>Length</th>
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{exam.classCode}</td>
                    <td>{exam.when}</td>
                    <td>{exam.length}</td>
                    <td><span className={`exam-status ${statusClass(exam.status)}`}><i />{exam.status}</span></td>
                    <td>
                      <div className="exam-actions-cell">
                        <button type="button" className="table-action">Edit</button>
                        <button type="button" className="table-action" onClick={() => duplicateExam(exam)}>Duplicate</button>
                        <button type="button" className="table-action" onClick={() => archiveExam(exam)}>Archive</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exams.length === 0 && <p className="no-roster-results">No exams yet. Create one to get started.</p>}
          </div>
        </section>

        <p className="placeholder-note">Sample exam data for preview</p>
      </main>

      {showCreate && (
        <CreateExamDialog
          onClose={() => setShowCreate(false)}
          onSave={saveDraft}
          onSchedule={scheduleExam}
          onPublish={publishExam}
        />
      )}
    </div>
  )
}
