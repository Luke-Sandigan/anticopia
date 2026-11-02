import type { ReactNode } from 'react'

type ReportCardProps = {
  title: string
  children: ReactNode
}

export function ReportCard({ title, children }: ReportCardProps) {
  const headingId = `report-card-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-[#d5e0ec] bg-white p-5 shadow-[0_8px_24px_rgba(16,45,75,0.04)] dark:border-[#344964] dark:bg-[#172942] sm:p-6"
    >
      <h2 id={headingId} className="mb-5 text-xl font-bold tracking-[-0.025em] text-[#102d4b] dark:text-[#eaf2fb]">{title}</h2>
      {children}
    </section>
  )
}
