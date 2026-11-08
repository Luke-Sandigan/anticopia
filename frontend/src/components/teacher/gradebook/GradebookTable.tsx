import type { GradeScores } from '../../../lib/gradebook'
import { gradebookColumns as columns, renderGradebookScore } from './GradebookTable.logic'

export interface GradebookRow {
  id: string
  studentName: string
  scores: GradeScores
}

type GradebookTableProps = {
  rows: GradebookRow[]
  weightedGrades: Record<string, number | null>
}

export function GradebookTable({ rows, weightedGrades }: GradebookTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#d5e0ec] text-xs font-medium text-[#5f7690]">
            <th scope="col" className="h-12 px-5">Student</th>
            {columns.map(({ key, label }) => <th scope="col" key={key} className="h-12 px-5 text-right">{label}</th>)}
            <th scope="col" className="h-12 px-5 text-right">Weighted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const weighted = weightedGrades[row.id]
            return (
              <tr key={row.id} className="border-b border-[#e7edf4] last:border-b-0">
                <th scope="row" className="h-16 px-5 text-left font-semibold text-[#102d4b]">{row.studentName}</th>
                {columns.map(({ key }) => (
                  <td key={key} className="h-16 px-5 text-right">
                    {renderGradebookScore(row.scores[key])}
                  </td>
                ))}
                <td className="h-16 px-5 text-right font-bold tabular-nums text-[#102d4b]">
                  {weighted === null ? '–' : `${weighted}%`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
