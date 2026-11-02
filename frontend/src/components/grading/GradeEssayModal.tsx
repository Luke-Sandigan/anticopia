import { useState, type FormEvent } from 'react'
import type { Attempt } from './AttemptsTable'
import { EssayAnswer } from './EssayAnswer'
import { PrimaryButton, SecondaryButton } from '../ui/Buttons'
import { Modal } from '../ui/Modal'

export const ESSAY_MAX_MARKS = 10

type GradeEssayModalProps = {
  attempt: Attempt
  onClose: () => void
  onSave: (attemptId: string, marks: number, feedback: string) => void
}

export function GradeEssayModal({ attempt, onClose, onSave }: GradeEssayModalProps) {
  const [marks, setMarks] = useState(() => attempt.essayMarks?.toString() ?? (attempt.id === 'maria-santos' ? '7' : ''))
  const [feedback, setFeedback] = useState(attempt.feedback ?? '')
  const [error, setError] = useState('')
  const titleId = 'grade-essay-title'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericMarks = Number(marks)
    if (marks.trim() === '' || !Number.isInteger(numericMarks) || numericMarks < 0 || numericMarks > ESSAY_MAX_MARKS) {
      setError(`Enter a whole number from 0 to ${ESSAY_MAX_MARKS}.`)
      return
    }

    onSave(attempt.id, numericMarks, feedback)
  }

  return (
    <Modal open onClose={onClose} title={`Grade essay: ${attempt.studentName}`} titleId={titleId}>
      <form className="mt-5 space-y-5" noValidate onSubmit={handleSubmit}>
        <EssayAnswer text="An essay answer appears here." />
        <div>
          <label htmlFor="essay-marks" className="mb-2 block text-sm font-medium text-[#102d4b]">Marks (of {ESSAY_MAX_MARKS})</label>
          <input
            id="essay-marks"
            type="number"
            min={0}
            max={ESSAY_MAX_MARKS}
            step={1}
            value={marks}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'essay-marks-error' : undefined}
            onChange={(event) => {
              setMarks(event.target.value)
              setError('')
            }}
            className="h-12 w-full rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] px-4 text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-4 focus:ring-[#2d76bf]/15"
          />
          {error && <p id="essay-marks-error" role="alert" className="mt-2 text-sm text-[#b3261e]">{error}</p>}
        </div>
        <div>
          <label htmlFor="essay-feedback" className="mb-2 block text-sm font-medium text-[#102d4b]">Feedback</label>
          <textarea
            id="essay-feedback"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="min-h-[120px] w-full resize-y rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] p-4 text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-4 focus:ring-[#2d76bf]/15"
          />
        </div>
        <div className="flex flex-col-reverse justify-end gap-3 pt-1 sm:flex-row">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Save marks</PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
