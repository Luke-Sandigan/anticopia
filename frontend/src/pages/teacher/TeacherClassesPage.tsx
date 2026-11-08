import { useNavigate } from 'react-router-dom'
import { ClassDialog } from '../../components/teacher/ClassDialog'
import { DashboardSidebar } from '../../components/teacher/DashboardSidebar'
import { useTeacherClassesPageLogic } from './TeacherClassesPage.logic'

export function TeacherClassesPage() {
  const navigate = useNavigate()
  const { classes, dialog, setDialog, editing, dark, notice, setNotice, toggleTheme, openCreate, openEdit, saveClass, regenerateCode, archiveClass, openClass } = useTeacherClassesPageLogic(navigate)

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} activePage="Classes" />
      <main className="dashboard-main classes-main">
        <header className="classes-header">
          <div><h1>My classes</h1><p>Create and manage your classes.</p></div>
          <button type="button" className="class-button primary create-class-button" onClick={openCreate}>Create class</button>
        </header>
        {notice && <p className="class-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></p>}
        <section className="class-grid" aria-label="Your classes">
          {classes.map((item) => <article className="managed-class-card" key={item.id}>
            <h2>{item.name}</h2>
            <p>{item.section} · {item.subject} · {item.term}</p>
            <div className="class-invite-row"><span className="class-code"><i />Code {item.code}</span><button type="button" className="generate-code" onClick={() => regenerateCode(item.id)}>Generate new</button></div>
            <div className="class-actions">
              <button type="button" className="class-button primary" onClick={() => openClass(item)}>Open</button>
              <button type="button" className="class-button secondary" onClick={() => openEdit(item)}>Edit</button>
              <button type="button" className="class-button secondary" onClick={() => archiveClass(item)}>Archive</button>
            </div>
          </article>)}
          {classes.length === 0 && <div className="empty-classes"><h2>No active classes</h2><p>Create a class to start sharing exams with your students.</p><button className="class-button primary" type="button" onClick={openCreate}>Create class</button></div>}
        </section>
        <p className="placeholder-note">Sample class details for preview</p>
      </main>
      {dialog && <ClassDialog mode={dialog} initialClass={editing} onClose={() => setDialog(null)} onSave={saveClass} />}
    </div>
  )
}
