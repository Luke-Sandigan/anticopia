export function ExamSummaryPanel() {
  return (
    <section className="dashboard-panel exam-summary" id="summary">
      <h2>Exam summary: Quiz 2, Arrays</h2>
      <div className="summary-content">
        <div><p>Average score</p><strong>81%</strong></div>
        <div className="submission-progress"><p>Submitted</p><div className="progress-track" role="progressbar" aria-label="Students submitted" aria-valuenow={30} aria-valuemin={0} aria-valuemax={32}><span /></div><small>30 of 32 students</small></div>
      </div>
    </section>
  )
}
