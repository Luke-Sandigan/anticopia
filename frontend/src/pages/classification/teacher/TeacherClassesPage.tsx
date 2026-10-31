import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClassDialog, type ClassDetails } from '../../../components/classification/teacher/ClassDialog'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { starterClasses } from '../../../data/teacherClasses'

function makeCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 4).toUpperCase()
}

export function TeacherClassesPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState(starterClasses)
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<ClassDetails | undefined>()
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function openCreate() { setEditing(undefined); setDialog('create') }
  function openEdit(classItem: ClassDetails) { setEditing(classItem); setDialog('edit') }
  function saveClass(details: Omit<ClassDetails, 'id' | 'code'>) {
    if (dialog === 'edit' && editing) {
      setClasses((current) => current.map((item) => item.id === editing.id ? { ...item, ...details } : item))
      setNotice('Class details saved.')
    } else {
      setClasses((current) => [...current, { ...details, id: `class-${Date.now()}`, code: makeCode() }])
      setNotice('Class created. Share its code with students to invite them.')
    }
    setDialog(null)
  }

  function regenerateCode(id: string) {
    setClasses((current) => current.map((item) => item.id === id ? { ...item, code: makeCode() } : item))
    setNotice('A new join code is ready to share.')
  }

  function archiveClass(item: ClassDetails) {
    setClasses((current) => current.filter((classItem) => classItem.id !== item.id))
    setNotice(`${item.name} was archived.`)
  }

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
              <button type="button" className="class-button primary" onClick={() => navigate(`/teacher/classes/${item.id}`, { state: item })}>Open</button>
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
