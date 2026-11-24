type DashboardStatCardProps = { label: string; value: string }
export function DashboardStatCard({ label, value }: DashboardStatCardProps) {
  return <article className="dashboard-stat"><p>{label}</p><strong>{value}</strong></article>
}
