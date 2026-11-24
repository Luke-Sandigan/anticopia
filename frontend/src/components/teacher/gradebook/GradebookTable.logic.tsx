import { StatusBadge } from '../grading/StatusBadge'
import type { CategoryKey, ScoreCell } from '../../../lib/gradebook'

export const gradebookColumns: Array<{ key: CategoryKey; label: string }> = [
  { key: 'quiz1', label: 'Quiz 1' },
  { key: 'quiz2', label: 'Quiz 2' },
  { key: 'midterm', label: 'Midterm' },
  { key: 'final', label: 'Final' },
]

export function renderGradebookScore(cell: ScoreCell) {
  if (cell.kind === 'missing') return <StatusBadge label="Missing" tone="missing" />
  if (cell.kind === 'excused') return <StatusBadge label="Excused" tone="excused" />
  return <span className="tabular-nums text-[#102d4b]">{cell.value}</span>
}
