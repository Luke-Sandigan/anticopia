import { Link } from 'react-router-dom'
import type { TeacherDashboard } from '../../lib/teacherDashboardApi'

const labels = { ongoing: 'Active', scheduled: 'Scheduled', draft: 'Draft' }
const examDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function UpcomingExamsPanel({ exams }: { exams: TeacherDashboard['exams'] }) {
  return (
    <section className="dashboard-panel exams-panel" id="exams">
      <h2>Upcoming and active exams</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Exam</th><th>Class</th><th>When</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {!exams.length && <tr><td colSpan={5}>No upcoming, active, or draft exams.</td></tr>}
            {exams.map((exam) => {
              const active = exam.status === 'ongoing'
              return <tr key={exam.id}>
                <td>{exam.title}</td><td>{exam.classCode}</td>
                <td>{exam.startsAt ? <time dateTime={exam.startsAt}>{examDate.format(new Date(exam.startsAt))}</time> : '—'}</td>
                <td><span className={`exam-status ${labels[exam.status].toLowerCase()}`}><i />{labels[exam.status]}</span></td>
                <td><Link to={active ? '/teacher/live-monitoring' : '/teacher/exams'} className={`table-action ${active ? 'primary' : ''}`}>{active ? 'Open monitoring' : 'Manage'}</Link></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
