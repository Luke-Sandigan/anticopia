import type { TeacherDashboard } from '../../lib/teacherDashboardApi'

export function MyClassesPanel({ classes }: { classes: TeacherDashboard['classes'] }) {
  return (
    <section className="dashboard-panel classes-panel" id="classes">
      <h2>My classes</h2>
      {!classes.length && <p>No active classes yet.</p>}
      <div className="class-cards">{classes.map((item) => <article className="class-card" key={item.id}>
        <strong>{item.name}</strong>
        <span>{item.section} · {item.studentCount} {item.studentCount === 1 ? 'student' : 'students'}</span>
      </article>)}</div>
    </section>
  )
}
