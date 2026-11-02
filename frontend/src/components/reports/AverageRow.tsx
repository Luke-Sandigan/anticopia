import type { AssessmentAverage } from '../../pages/teacher/reports/mockReportsData'
import { ProgressBar } from './ProgressBar'

type AverageRowProps = {
  assessment: AssessmentAverage
}

export function AverageRow({ assessment }: AverageRowProps) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)_44px] items-center gap-3">
      <span className="text-sm text-[#5f7690]">{assessment.label}</span>
      <ProgressBar percent={assessment.percent} label={`${assessment.label} average`} />
      <span className="text-right text-sm font-bold tabular-nums text-[#102d4b]">{assessment.percent}%</span>
    </div>
  )
}
