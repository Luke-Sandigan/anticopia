const alerts = [
  { type: 'Copied text', student: 'Miguel Tan', details: 'Pasted text into an answer', time: '20:48', tone: 'copied' },
  { type: 'Left tab', student: 'Ana Reyes', details: 'Switched to another tab', time: '10:02', tone: 'tab' },
  { type: 'Copied text', student: 'Miguel Tan', details: 'Copied text from question 2', time: '10:05', tone: 'copied' },
]

export function RecentAlertsPanel() {
  return (
    <section className="dashboard-panel alerts-panel">
      <h2>Recent alerts</h2>
      <ul>{alerts.map((alert, index) => <li key={`${alert.student}-${alert.time}-${index}`}>
        <span className={`alert-type ${alert.tone}`}><i />{alert.type}</span>
        <strong>{alert.student}</strong>
        <p>{alert.details}</p>
        <time>{alert.time}</time>
      </li>)}</ul>
    </section>
  )
}
