import type { TeacherDashboard } from '../../lib/teacherDashboardApi'

const alertTypes = new Map([
  ['tab_switch', { label: 'Left tab', details: 'Switched to another tab', tone: 'tab' }],
  ['copied_text', { label: 'Copied text', details: 'Copied text during the exam', tone: 'copied' }],
  ['pasted_text', { label: 'Pasted text', details: 'Pasted text during the exam', tone: 'copied' }],
  ['multi_device', { label: 'Multiple devices', details: 'Multiple device activity was flagged', tone: 'tab' }],
])
const alertTime = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' })

export function RecentAlertsPanel({ alerts }: { alerts: TeacherDashboard['alerts'] }) {
  return (
    <section className="dashboard-panel alerts-panel">
      <h2>Recent alerts</h2>
      {!alerts.length && <p>No recent alerts.</p>}
      {alerts.length > 0 && <ul>{alerts.map((alert) => {
        const event = alertTypes.get(alert.type)
        return <li key={alert.id}>
          <span className={`alert-type ${event?.tone ?? 'tab'}`}><i />{event?.label ?? 'Flagged activity'}</span>
          <strong>{alert.student}</strong>
          <p>{alert.details || event?.details || 'Activity flagged during the exam'}</p>
          <time dateTime={alert.createdAt}>{alertTime.format(new Date(alert.createdAt))}</time>
        </li>
      })}</ul>}
    </section>
  )
}
