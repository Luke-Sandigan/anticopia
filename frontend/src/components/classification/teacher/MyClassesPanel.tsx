const classes = [
  { course: 'IT-201 Data Structures', detail: 'Section A · 32 students' },
  { course: 'IT-305 Databases', detail: 'Section B · 28 students' },
  { course: 'IT-110 Intro to Programming', detail: 'Section C · 40 students' },
]

export function MyClassesPanel() {
  return <section className="dashboard-panel classes-panel" id="classes"><h2>My classes</h2><div className="class-cards">{classes.map((item) => <article className="class-card" key={item.course}><strong>{item.course}</strong><span>{item.detail}</span></article>)}</div></section>
}
