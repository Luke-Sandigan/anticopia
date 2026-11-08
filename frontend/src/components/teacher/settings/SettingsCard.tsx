import type { ReactNode } from 'react'

type SettingsCardProps = {
  title: string
  children: ReactNode
}

export function SettingsCard({ title, children }: SettingsCardProps) {
  const titleId = `settings-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border border-[#d5e0ec] bg-white p-5 shadow-[0_8px_24px_rgba(16,45,75,0.04)] sm:p-6"
    >
      <h2 id={titleId} className="mb-5 text-xl font-bold tracking-[-0.025em] text-[#102d4b]">{title}</h2>
      {children}
    </section>
  )
}
