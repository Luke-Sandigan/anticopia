import { Link, useLocation, useParams } from 'react-router-dom'
import { AddStudentDialog } from '../../components/teacher/AddStudentDialog'
import { DashboardSidebar } from '../../components/teacher/DashboardSidebar'
import { classExams, useTeacherClassDetailPageLogic } from './TeacherClassDetailPage.logic'

export function TeacherClassDetailPage() {
  const { classId } = useParams()
  const location = useLocation()
  const { classItem, search, setSearch, showAddStudent, setShowAddStudent, showImport, setShowImport, dark, notice, setNotice, setFileName, visibleRoster, toggleTheme, addStudent, importRoster, removeStudent } = useTeacherClassDetailPageLogic(classId, location.state)

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
            <td><button className="class-button secondary remove-student" type="button" onClick={() => removeStudent(student)}>Remove</button></td>
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
