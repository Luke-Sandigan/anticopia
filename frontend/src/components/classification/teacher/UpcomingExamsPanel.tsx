const exams = [
  { name: 'Midterm: Data Structures', className: 'IT-201', when: 'Today, 10:00', status: 'Active', action: 'Open monitoring' },
  { name: 'Quiz 3: SQL Joins', className: 'IT-305', when: 'Oct 22, 14:00', status: 'Scheduled', action: 'Manage' },
  { name: 'Finals: Intro to Programming', className: 'IT-110', when: 'Dec 10, 09:00', status: 'Draft', action: 'Manage' },
]

export function UpcomingExamsPanel() {
  return (
    <section className="dashboard-panel exams-panel" id="exams">
      <h2>Upcoming and active exams</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Exam</th><th>Class</th><th>When</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>{exams.map((exam) => <tr key={exam.name}>
            <td>{exam.name}</td><td>{exam.className}</td><td>{exam.when}</td>
            <td><span className={`exam-status ${exam.status.toLowerCase()}`}><i />{exam.status}</span></td>
            <td><button type="button" className={`table-action ${exam.status === 'Active' ? 'primary' : ''}`}>{exam.action}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}
