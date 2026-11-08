type StatusBadgeTone = 'submitted' | 'graded' | 'needs_grading' | 'in_progress' | 'missing' | 'excused'

type StatusBadgeProps = {
  label: string
  tone: StatusBadgeTone
}

const toneClasses: Record<StatusBadgeTone, string> = {
  submitted: 'bg-[#e3f3e9] text-[#376b4e]',
  graded: 'bg-[#e3f3e9] text-[#376b4e]',
  needs_grading: 'bg-[#fff1d2] text-[#805500]',
  in_progress: 'bg-[#fff1d2] text-[#805500]',
  missing: 'bg-[#edf1f5] text-[#5f7690]',
  excused: 'bg-[#eaf3fc] text-[#246db4]',
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
