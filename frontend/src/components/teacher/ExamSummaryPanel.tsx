import type { TeacherDashboard } from '../../lib/teacherDashboardApi'

export function ExamSummaryPanel({ summary }: { summary: TeacherDashboard['summary'] }) {
  return (
    <section className="dashboard-panel exam-summary" id="summary">
      <h2>{summary ? `Exam summary: ${summary.title}` : 'Exam summary'}</h2>
      {summary ? <div className="summary-content">
        <div><p>Average score</p><strong>{summary.averageScore === null ? '—' : `${summary.averageScore}%`}</strong></div>
        <div className="submission-progress">
          <p>Submitted</p>
          {summary.enrolled > 0 && <div className="progress-track" role="progressbar" aria-label="Students submitted"
            aria-valuenow={summary.submitted} aria-valuemin={0} aria-valuemax={summary.enrolled}>
            <span style={{ width: `${summary.submitted / summary.enrolled * 100}%` }} />
          </div>}
          <small>{summary.submitted} of {summary.enrolled} students</small>
        </div>
      </div> : <p>No exam submissions yet.</p>}
    </section>
  )
}
