import type { Attempt } from './AttemptsTable'
import { EssayAnswer } from './EssayAnswer'
import { PrimaryButton, SecondaryButton } from '../../shared/Buttons'
import { Modal } from '../../shared/Modal'
import { ESSAY_MAX_MARKS, useGradeEssayModalLogic } from './GradeEssayModal.logic'

type GradeEssayModalProps = {
  attempt: Attempt
  onClose: () => void
  onSave: (attemptId: string, marks: number, feedback: string) => void
}

export function GradeEssayModal({ attempt, onClose, onSave }: GradeEssayModalProps) {
  const { marks, feedback, error, handleSubmit, handleMarksChange, setFeedback } = useGradeEssayModalLogic(attempt, onSave)
  const titleId = 'grade-essay-title'

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
            onChange={(event) => handleMarksChange(event.target.value)}
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
