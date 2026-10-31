import { useEffect, useState, type FormEvent } from 'react'
import { starterClasses } from '../../../data/teacherClasses'

export interface ExamFormData {
  title: string
  classCode: string
  instructions: string
  duration: number
  attemptLimit: number
  availableFrom: string
  availableUntil: string
  allEnrolled: boolean
  excludeExcused: boolean
  randomizeQuestions: boolean
  randomizeChoices: boolean
  allowCalculator: boolean
  allowNotes: boolean
  detectTabSwitches: boolean
  detectCopyPaste: boolean
  requireFullscreen: boolean
  shareStudentScreen: boolean
  autoGradeObjective: boolean
  releaseGradesManually: boolean
}

const defaultForm: ExamFormData = {
  title: '',
  classCode: starterClasses[0]?.id ?? '',
  instructions: '',
  duration: 90,
  attemptLimit: 1,
  availableFrom: '',
  availableUntil: '',
  allEnrolled: true,
  excludeExcused: false,
  randomizeQuestions: true,
  randomizeChoices: true,
  allowCalculator: false,
  allowNotes: false,
  detectTabSwitches: true,
  detectCopyPaste: true,
  requireFullscreen: true,
  shareStudentScreen: true,
  autoGradeObjective: true,
  releaseGradesManually: true,
}

type CreateExamDialogProps = {
  onClose: () => void
  onSave: (data: ExamFormData) => void
  onSchedule: (data: ExamFormData) => void
  onPublish: (data: ExamFormData) => void
}

export function CreateExamDialog({ onClose, onSave, onSchedule, onPublish }: CreateExamDialogProps) {
  const [form, setForm] = useState<ExamFormData>(defaultForm)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function set<K extends keyof ExamFormData>(key: K, value: ExamFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="class-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="exam-dialog" role="dialog" aria-modal="true" aria-labelledby="exam-dialog-title">
        <header className="exam-dialog-header">
          <div>
            <h2 id="exam-dialog-title">Create exam</h2>
            <p>Set it up, then save, schedule, or publish.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="exam-dialog-body">
            {/* Left column — Details */}
            <div className="exam-dialog-details">
              <h3>Details</h3>

              <label className="exam-field">
                <span className="exam-field-label">Exam title</span>
                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Midterm: Data Structures"
                />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Class</span>
                <select value={form.classCode} onChange={(e) => set('classCode', e.target.value)}>
                  {starterClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Instructions</span>
                <textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => set('instructions', e.target.value)}
                  placeholder="Answer all questions. Do not leave the exam tab."
                />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Duration (minutes)</span>
                <input type="number" min={1} value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Attempt limit</span>
                <input type="number" min={1} value={form.attemptLimit} onChange={(e) => set('attemptLimit', Number(e.target.value))} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Available from</span>
                <input type="datetime-local" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Available until</span>
                <input type="datetime-local" value={form.availableUntil} onChange={(e) => set('availableUntil', e.target.value)} />
              </label>
            </div>

            {/* Right column — Options */}
            <div className="exam-dialog-options">
              <fieldset className="exam-option-group">
                <legend>Eligible students</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.allEnrolled} onChange={(e) => set('allEnrolled', e.target.checked)} /><span>All enrolled students</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.excludeExcused} onChange={(e) => set('excludeExcused', e.target.checked)} /><span>Exclude excused students</span></label>
              </fieldset>

              <fieldset className="exam-option-group">
                <legend>Randomization and resources</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.randomizeQuestions} onChange={(e) => set('randomizeQuestions', e.target.checked)} /><span>Randomize question order</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.randomizeChoices} onChange={(e) => set('randomizeChoices', e.target.checked)} /><span>Randomize answer choices</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.allowCalculator} onChange={(e) => set('allowCalculator', e.target.checked)} /><span>Allow calculator</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.allowNotes} onChange={(e) => set('allowNotes', e.target.checked)} /><span>Allow notes</span></label>
              </fieldset>

              <fieldset className="exam-option-group">
                <legend>Monitoring rules</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.detectTabSwitches} onChange={(e) => set('detectTabSwitches', e.target.checked)} /><span>Detect tab switches</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.detectCopyPaste} onChange={(e) => set('detectCopyPaste', e.target.checked)} /><span>Detect copy and paste</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.requireFullscreen} onChange={(e) => set('requireFullscreen', e.target.checked)} /><span>Require fullscreen</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.shareStudentScreen} onChange={(e) => set('shareStudentScreen', e.target.checked)} /><span>Share student screen</span></label>
              </fieldset>

              <fieldset className="exam-option-group">
                <legend>Grading</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.autoGradeObjective} onChange={(e) => set('autoGradeObjective', e.target.checked)} /><span>Auto-grade objective questions</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.releaseGradesManually} onChange={(e) => set('releaseGradesManually', e.target.checked)} /><span>Release grades manually</span></label>
              </fieldset>
            </div>
          </div>

          {/* Footer actions */}
          <footer className="exam-dialog-footer">
            <button type="submit" className="class-button secondary">Save draft</button>
            <button type="button" className="class-button secondary" onClick={() => onSchedule(form)}>Schedule</button>
            <button type="button" className="class-button primary" onClick={() => onPublish(form)}>Publish</button>
            <button type="button" className="exam-cancel-button" onClick={onClose}>Cancel</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
