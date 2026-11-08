import { DashboardSidebar } from '../../components/teacher/DashboardSidebar'
import { CreateExamDialog } from '../../components/teacher/CreateExamDialog'
import { statusClass, useTeacherExamsPageLogic } from './TeacherExamsPage.logic'

export function TeacherExamsPage() {
  const { exams, showCreate, setShowCreate, dark, notice, setNotice, toggleTheme, saveDraft, scheduleExam, publishExam, duplicateExam, archiveExam } = useTeacherExamsPageLogic()

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
