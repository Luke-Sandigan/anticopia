import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AddStudentDialog } from '../../../components/classification/teacher/AddStudentDialog'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import type { ClassDetails } from '../../../components/classification/teacher/ClassDialog'
import { starterClasses } from '../../../data/teacherClasses'

type Student = { name: string; id: string; enrollment: 'Enrolled'; account: 'Active' | 'Not verified'; performance: number }

const initialRoster: Student[] = [
  { name: 'Maria Santos', id: '2023-0141', enrollment: 'Enrolled', account: 'Active', performance: 88 },
  { name: 'Juan dela Cruz', id: '2023-0152', enrollment: 'Enrolled', account: 'Active', performance: 74 },
  { name: 'Ana Reyes', id: '2023-0167', enrollment: 'Enrolled', account: 'Active', performance: 91 },
  { name: 'Carlo Mendoza', id: '2023-0173', enrollment: 'Enrolled', account: 'Active', performance: 67 },
  { name: 'Bea Lim', id: '2023-0188', enrollment: 'Enrolled', account: 'Active', performance: 95 },
  { name: 'Paolo Garcia', id: '2023-0194', enrollment: 'Enrolled', account: 'Not verified', performance: 58 },
  { name: 'Isa Navarro', id: '2023-0203', enrollment: 'Enrolled', account: 'Active', performance: 82 },
  { name: 'Miguel Tan', id: '2023-0219', enrollment: 'Enrolled', account: 'Active', performance: 79 },
]

const classExams = [
  { name: 'Midterm: Data Structures', when: 'Today, 10:00', status: 'Active' },
  { name: 'Quiz 2: Arrays', when: 'Oct 10, 10:00', status: 'Closed' },
]

function initialClassForRoute(id: string | undefined, state: unknown): ClassDetails {
  if (state && typeof state === 'object' && 'name' in state) return state as ClassDetails
  return starterClasses.find((item) => item.id === id) ?? starterClasses[0]
}

export function TeacherClassDetailPage() {
  const { classId } = useParams()
  const location = useLocation()
  const classItem = initialClassForRoute(classId, location.state)
  const [roster, setRoster] = useState(initialRoster)
  const [search, setSearch] = useState('')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')
  const [fileName, setFileName] = useState('')
  const visibleRoster = useMemo(() => roster.filter((student) => `${student.name} ${student.id}`.toLowerCase().includes(search.toLowerCase())), [roster, search])

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function addStudent(identifier: string) {
    const emailName = identifier.includes('@') ? identifier.split('@')[0].replace(/[._-]+/g, ' ') : ''
    const name = emailName ? emailName.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'New student'
    const id = identifier.includes('@') ? `NEW-${String(roster.length + 1).padStart(4, '0')}` : identifier
    setRoster((current) => [...current, { name, id, enrollment: 'Enrolled', account: 'Not verified', performance: 0 }])
    setNotice(`${name} was added to the class roster.`)
    setShowAddStudent(false)
  }

  function importRoster(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(fileName ? `${fileName} is ready for roster import when backend support is added.` : 'Choose a roster file to continue.')
    setShowImport(false)
  }

  return <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
    <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} activePage="Classes" />
    <main className="dashboard-main class-detail-main">
      <header className="class-detail-header">
        <div><h1>{classItem.name}</h1><p>{classItem.section} · {classItem.term} · code {classItem.code}</p></div>
        <Link to="/teacher/classes" className="class-button secondary back-to-classes">Back to classes</Link>
      </header>
      {notice && <p className="class-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></p>}
      <section className="dashboard-panel roster-panel">
        <div className="roster-heading"><h2>Student roster</h2><div className="roster-actions"><button className="class-button secondary" type="button" onClick={() => setShowImport(true)}>Import roster</button><button className="class-button primary" type="button" onClick={() => setShowAddStudent(true)}>Add student</button></div></div>
        <label className="roster-search"><span className="sr-only">Search students by name or student ID</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or student ID" /></label>
        <div className="table-scroll roster-table-scroll"><table className="roster-table"><thead><tr><th>Student</th><th>ID</th><th>Enrollment</th><th>Account</th><th>Performance</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>{visibleRoster.map((student) => <tr key={student.id}>
            <td>{student.name}</td><td>{student.id}</td><td><span className="roster-status enrolled"><i />{student.enrollment}</span></td>
            <td><span className={`roster-status ${student.account === 'Active' ? 'active' : 'unverified'}`}><i />{student.account}</span></td>
            <td><div className="performance-cell"><span className="performance-track"><i style={{ width: `${student.performance}%` }} /></span><span>{student.performance}%</span></div></td>
            <td><button className="class-button secondary remove-student" type="button" onClick={() => { setRoster((current) => current.filter((item) => item.id !== student.id)); setNotice(`${student.name} was removed from the roster.`) }}>Remove</button></td>
          </tr>)}</tbody>
        </table>{visibleRoster.length === 0 && <p className="no-roster-results">No students match “{search}”.</p>}</div>
      </section>
      <section className="dashboard-panel class-exams-panel"><h2>Class exams</h2><div className="table-scroll"><table><thead><tr><th>Exam</th><th>When</th><th>Status</th></tr></thead><tbody>{classExams.map((exam) => <tr key={exam.name}><td>{exam.name}</td><td>{exam.when}</td><td><span className={`roster-status ${exam.status === 'Active' ? 'active' : 'closed'}`}><i />{exam.status}</span></td></tr>)}</tbody></table></div></section>
      <p className="placeholder-note">Sample roster and exam data for preview</p>
    </main>
    {showAddStudent && <AddStudentDialog onClose={() => setShowAddStudent(false)} onAdd={addStudent} />}
    {showImport && <div className="class-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowImport(false) }}><section className="class-dialog import-roster-dialog" role="dialog" aria-modal="true" aria-labelledby="import-roster-title"><h2 id="import-roster-title">Import roster</h2><form onSubmit={importRoster}><label>Roster file (CSV)<input type="file" accept=".csv,text/csv" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} /></label><div className="class-dialog-actions"><button className="class-button secondary" type="button" onClick={() => setShowImport(false)}>Cancel</button><button className="class-button primary" type="submit">Continue</button></div></form></section></div>}
  </div>
}
