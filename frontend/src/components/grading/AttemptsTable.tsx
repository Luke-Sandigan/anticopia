import { StatusBadge } from './StatusBadge'

export type AttemptStatus = 'submitted' | 'missing' | 'in_progress'
export type EssayStatus = 'needs_grading' | 'graded' | null

export interface Attempt {
  id: string
  studentName: string
  status: AttemptStatus
  autoScore: number | null
  totalPoints: number
  essayStatus: EssayStatus
  essayMarks?: number
  feedback?: string
}

type AttemptsTableProps = {
  attempts: Attempt[]
  onGrade: (attemptId: string) => void
}

const attemptStatusLabels: Record<AttemptStatus, string> = {
  submitted: 'Submitted',
  missing: 'Missing',
  in_progress: 'In progress',
}

const essayStatusLabels: Record<Exclude<EssayStatus, null>, string> = {
  needs_grading: 'Needs grading',
  graded: 'Graded',
}

export function AttemptsTable({ attempts, onGrade }: AttemptsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#d5e0ec] text-xs font-medium text-[#5f7690] dark:border-[#344964] dark:text-[#a3b7cf]">
            <th scope="col" className="h-11 px-5">Student</th>
            <th scope="col" className="h-11 px-5">Status</th>
            <th scope="col" className="h-11 px-5">Auto score</th>
            <th scope="col" className="h-11 px-5">Essay</th>
            <th scope="col" className="h-11 px-5"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt.id} className="border-b border-[#e7edf4] last:border-b-0 dark:border-[#344964]">
              <th scope="row" className="h-[68px] px-5 text-left font-semibold text-[#102d4b] dark:text-[#eaf2fb]">{attempt.studentName}</th>
              <td className="h-[68px] px-5">
                <StatusBadge label={attemptStatusLabels[attempt.status]} tone={attempt.status} />
              </td>
              <td className="h-[68px] px-5 text-[#102d4b] dark:text-[#eaf2fb]">
                {attempt.autoScore === null ? <span className="text-[#8295aa] dark:text-[#a3b7cf]">–</span> : `${attempt.autoScore} / ${attempt.totalPoints}`}
              </td>
              <td className="h-[68px] px-5">
                {attempt.essayStatus === null
                  ? <span className="text-[#8295aa] dark:text-[#a3b7cf]">–</span>
                  : <StatusBadge label={essayStatusLabels[attempt.essayStatus]} tone={attempt.essayStatus} />}
              </td>
              <td className="h-[68px] px-5 text-right">
                {attempt.essayStatus === 'needs_grading' && (
                  <button
                    type="button"
                    onClick={() => onGrade(attempt.id)}
                    aria-label={`Grade ${attempt.studentName}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#2d76bf] px-4 text-sm font-semibold text-white transition hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25"
                  >
                    Grade
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
